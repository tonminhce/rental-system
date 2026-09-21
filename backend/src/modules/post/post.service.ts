import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal, fn, col } from 'sequelize';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { GetMapPostsDto } from './dto/get-map-posts.dto';
import {
  buildPostWhere,
  boundsWhere,
  distanceSql,
  mapGrid,
  postCoordinates,
} from './post-filters';
import { RentalPost } from '../../database/entities/rental-post.entity';
import { RentalImage } from '../../database/entities/rental-image.entity';
import { FavoriteList } from '../../database/entities/favorite-list.entity';
import { loggerUtil } from '../../shared/utils/log.util';
import { SequelizeErrorUtil } from 'src/utils/sequelize-error.util';

const _serviceName = 'PostService';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(RentalPost)
    private rentalPostModel: typeof RentalPost,
    @InjectModel(RentalImage)
    private rentalImageModel: typeof RentalImage,
    @InjectModel(FavoriteList)
    private favoriteListModel: typeof FavoriteList,
  ) {}

  async getMapPosts(query: GetMapPostsDto) {
    const grid = mapGrid(query.mapBounds);
    const latCell = literal(`FLOOR(latitude / ${grid.lat})`);
    const lngCell = literal(`FLOOR(longitude / ${grid.lng})`);
    const groups: any[] = await this.rentalPostModel.findAll({
      attributes: [
        [latCell, 'latCell'],
        [lngCell, 'lngCell'],
        [fn('COUNT', col('id')), 'count'],
        [fn('MIN', col('id')), 'id'],
        [fn('MIN', col('name')), 'name'],
        [fn('MIN', col('price')), 'price'],
        [fn('MIN', col('area')), 'area'],
        [fn('MIN', col('district')), 'district'],
        [fn('AVG', col('latitude')), 'lat'],
        [fn('AVG', col('longitude')), 'lng'],
        [fn('MIN', col('latitude')), 'south'],
        [fn('MAX', col('latitude')), 'north'],
        [fn('MIN', col('longitude')), 'west'],
        [fn('MAX', col('longitude')), 'east'],
      ],
      where: {
        [Op.and]: [buildPostWhere(query), boundsWhere(query.mapBounds)],
      },
      group: ['latCell', 'lngCell'],
      raw: true,
    });
    const markers = groups.map((row) => {
      const count = Number(row.count);
      return {
        key: `${row.latCell}:${row.lngCell}`,
        count,
        ...(count === 1
          ? {
              id: Number(row.id),
              name: row.name,
              price: Number(row.price),
              area: Number(row.area),
              district: row.district,
            }
          : {}),
        coordinates: [Number(row.lng), Number(row.lat)],
        bounds: [
          Number(row.south),
          Number(row.west),
          Number(row.north),
          Number(row.east),
        ],
      };
    });
    return {
      markers,
      total: markers.reduce((sum, marker) => sum + marker.count, 0),
    };
  }

  async getPosts(getPostsDto: GetPostsDto, userId: number) {
    try {
      loggerUtil.info(`${_serviceName}.getPosts start`, {
        getPostsDto,
        userId,
      });
      const { page = 1, limit = 10, centerLat, centerLng } = getPostsDto;
      const offset = (page - 1) * limit;
      const whereConditions = buildPostWhere(getPostsDto);

      loggerUtil.info(`${_serviceName}.getPosts querying database`, {
        whereConditions,
        limit,
        offset,
      });

      const orderClause: any[] = [];
      if (getPostsDto.sort === 'price_asc') orderClause.push(['price', 'ASC']);
      else if (getPostsDto.sort === 'price_desc')
        orderClause.push(['price', 'DESC']);
      else if (getPostsDto.sort === 'area_desc')
        orderClause.push(['area', 'DESC']);
      else if (
        !getPostsDto.sort &&
        centerLat !== undefined &&
        centerLng !== undefined
      ) {
        orderClause.push([literal(distanceSql(centerLat, centerLng)), 'ASC']);
      }
      orderClause.push(['createdAt', 'DESC']);

      // Imported batches share timestamps. A unique tie-breaker prevents duplicate
      // or skipped records between pages.
      orderClause.push(['id', 'DESC']);
      const { rows, count } = await this.rentalPostModel.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: RentalImage,
            as: 'images',
          },
        ],
        limit,
        offset,
        order: orderClause,
        distinct: true,
      });

      let postsWithFavorites: any[] = [];
      if (userId) {
        loggerUtil.info(
          `${_serviceName}.getPosts fetching favorites for user`,
          { userId },
        );
        const favorites = await this.favoriteListModel.findAll({
          where: {
            userId,
            rentalId: {
              [Op.in]: rows.map((post) => post.id),
            },
          },
        });

        const favoritePostIds = new Set(favorites.map((fav) => fav.rentalId));

        postsWithFavorites = rows.map((post) => {
          const plainPost = post.get({ plain: true });
          return {
            ...plainPost,
            isFavourite: favoritePostIds.has(post.id),
            coordinates: postCoordinates(plainPost),
          };
        });
      } else {
        postsWithFavorites = rows.map((post) => {
          const plainPost = post.get({ plain: true });
          return {
            ...plainPost,
            isFavourite: false,
            coordinates: postCoordinates(plainPost),
          };
        });
      }

      loggerUtil.info(`${_serviceName}.getPosts completed`, {
        totalPosts: count,
        returnedPosts: postsWithFavorites.length,
      });
      return {
        data: postsWithFavorites,
        pagination: {
          total_records: count,
          current_page: page,
          page_size: limit,
          total_pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.getPosts error: ${error.message}`,
        error,
      );
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async getFavoritePosts(userId: number, page: number, limit: number) {
    try {
      loggerUtil.info(`${_serviceName}.getFavoritePosts start`, {
        userId,
        page,
        limit,
      });
      const offset = (page - 1) * limit;

      const { rows, count } = await this.rentalPostModel.findAndCountAll({
        include: [
          {
            model: RentalImage,
            as: 'images',
          },
          {
            model: FavoriteList,
            as: 'favorites',
            where: { userId },
            required: true,
          },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        distinct: true,
      });

      // Clean up the response
      const posts = rows.map((post) => {
        const plainPost = post.get({ plain: true });
        return {
          ...plainPost,
          isFavorite: true,
          favorites: undefined,
        };
      });

      loggerUtil.info(`${_serviceName}.getFavoritePosts completed`, {
        totalFavorites: count,
        returnedPosts: posts.length,
      });
      return {
        posts,
        pagination: {
          total: count,
          current_page: page,
          page_size: limit,
          total_pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.getFavoritePosts error: ${error.message}`,
        error,
      );
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async getPost(id: number, userId: number | null) {
    try {
      loggerUtil.info(`${_serviceName}.getPost start`, { id, userId });
      const post = await this.rentalPostModel.findByPk(id, {
        include: [
          {
            model: RentalImage,
            as: 'images',
          },
        ],
      });

      if (!post) {
        loggerUtil.warn(`${_serviceName}.getPost post not found`, { id });
        throw new NotFoundException(`Post with ID ${id} not found`);
      }

      const plainPost: any = post.get({ plain: true });

      // Add favorite status if user is logged in
      if (userId) {
        loggerUtil.info(`${_serviceName}.getPost checking favorite status`, {
          id,
          userId,
        });
        const favorite = await this.favoriteListModel.findOne({
          where: {
            rentalId: id,
            userId,
          },
        });

        plainPost.isFavourite = !!favorite;
      } else {
        plainPost.isFavourite = false;
      }

      plainPost.coordinates = postCoordinates(plainPost);

      plainPost.address = {
        province: plainPost.province,
        district: plainPost.district,
        ward: plainPost.ward,
        street: plainPost.street,
      };

      loggerUtil.info(`${_serviceName}.getPost completed`, { id });
      return plainPost;
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.getPost error: ${error.message}`,
        error,
      );
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async createPost(createPostDto: CreatePostDto, userId: number) {
    try {
      loggerUtil.info(`${_serviceName}.createPost start`, {
        createPostDto,
        userId,
      });
      const { images, ...postData } = createPostDto;

      const post = await this.rentalPostModel.create({
        ...postData,
        user_id: userId,
        status: 'active',
      } as any);

      if (images && images.length > 0) {
        const imageRecords = images.map((url) => ({
          rentalId: post.id,
          url,
        }));

        await this.rentalImageModel.bulkCreate(imageRecords);
      }
      loggerUtil.info(`${_serviceName}.createPost completed`, {
        postId: post.id,
      });
      return this.getPost(post.id, userId);
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.createPost error: ${error.message}`,
        error,
      );
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async addFavorite(id: number, userId: number) {
    try {
      loggerUtil.info(`${_serviceName}.addFavorite start`, { id, userId });
      const post = await this.rentalPostModel.findByPk(id);

      if (!post) {
        loggerUtil.warn(`${_serviceName}.addFavorite post not found`, { id });
        throw new NotFoundException(`Post with ID ${id} not found`);
      }

      const existingFavorite = await this.favoriteListModel.findOne({
        where: {
          rentalId: id,
          userId,
        },
      });

      if (!existingFavorite) {
        loggerUtil.info(`${_serviceName}.addFavorite creating new favorite`, {
          id,
          userId,
        });
        await this.favoriteListModel.create({
          rentalId: id,
          userId,
        });
      } else {
        loggerUtil.info(`${_serviceName}.addFavorite favorite already exists`, {
          id,
          userId,
        });
      }

      loggerUtil.info(`${_serviceName}.addFavorite completed`, { id, userId });
      return true;
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.addFavorite error: ${error.message}`,
        error,
      );
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async removeFavorite(id: number, userId: number) {
    try {
      loggerUtil.info(`${_serviceName}.removeFavorite start`, { id, userId });
      const favorite = await this.favoriteListModel.findOne({
        where: {
          rentalId: id,
          userId,
        },
      });

      if (favorite) {
        loggerUtil.info(`${_serviceName}.removeFavorite deleting favorite`, {
          id,
          userId,
        });
        await favorite.destroy();
      } else {
        loggerUtil.info(`${_serviceName}.removeFavorite favorite not found`, {
          id,
          userId,
        });
      }

      loggerUtil.info(`${_serviceName}.removeFavorite completed`, {
        id,
        userId,
      });
      return true;
    } catch (error) {
      loggerUtil.error(
        `${_serviceName}.removeFavorite error: ${error.message}`,
        error,
      );
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
}
