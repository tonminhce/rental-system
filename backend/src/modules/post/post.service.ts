import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
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

  async getPosts(getPostsDto: GetPostsDto, userId: number) {
    try {
      const {
        page,
        limit,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        propertyType,
        transactionType,
        province,
        district,
        ward,
        minBedrooms,
        minBathrooms,
        centerLat,
        centerLng,
        radius,
        bounds,
      } = getPostsDto;

      const offset = (page - 1) * limit;
      const whereConditions: any = {
        status: 'active',
      };

      if (minPrice !== undefined || maxPrice !== undefined) {
        whereConditions.price = {};
        if (minPrice !== undefined) {
          whereConditions.price[Op.gte] = minPrice;
        }
        if (maxPrice !== undefined) {
          whereConditions.price[Op.lte] = maxPrice;
        }
      }

      if (minArea !== undefined || maxArea !== undefined) {
        whereConditions.area = {};
        if (minArea !== undefined) {
          whereConditions.area[Op.gte] = minArea;
        }
        if (maxArea !== undefined) {
          whereConditions.area[Op.lte] = maxArea;
        }
      }

      if (minBathrooms !== undefined) {
        whereConditions.bathrooms = { [Op.gte]: minBathrooms };
      }

      // Only apply propertyType filter if it exists
      if (propertyType) {
        if (typeof propertyType === 'string' && propertyType.includes(',')) {
          const propertyTypes = propertyType.split(',');
          whereConditions.propertyType = { [Op.in]: propertyTypes };
        } else {
          whereConditions.propertyType = propertyType;
        }
      }

      if (transactionType) {
        whereConditions.transactionType = transactionType;
      }

      if (province) {
        whereConditions.province = province;
      }
      if (district) {
        whereConditions.district = district;
      }
      if (ward) {
        whereConditions.ward = ward;
      }

      if (minBedrooms !== undefined) {
        whereConditions.bedrooms = { [Op.gte]: minBedrooms };
      }

      // Location-based filtering using radius search
      if (
        centerLat !== undefined &&
        centerLng !== undefined &&
        radius !== undefined
      ) {
        const haversine = `
          (
            6371 * acos(
              cos(radians(${centerLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${centerLng})) + 
              sin(radians(${centerLat})) * sin(radians(latitude))
            )
          )
        `;

        whereConditions[Op.and] = literal(`${haversine} <= ${radius}`);
      }
      // Fallback to bounding box search
      else if (bounds) {
        const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
        whereConditions.latitude = { [Op.between]: [minLat, maxLat] };
        whereConditions.longitude = { [Op.between]: [minLng, maxLng] };
      }

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
        order: [['createdAt', 'DESC']],
        distinct: true,
      });

      let postsWithFavorites: any[] = [];
      if (userId) {
        const favorites = await this.favoriteListModel.findAll({
          where: {
            userId,
            rentalId: {
              [Op.in]: rows.map(post => post.id)
            }
          }
        });

        const favoritePostIds = new Set(favorites.map(fav => fav.rentalId));
        
        postsWithFavorites = rows.map(post => {
          const plainPost = post.get({ plain: true });
          return {
            ...plainPost,
            isFavorite: favoritePostIds.has(post.id),
            coordinates: {
              type: 'Point',
              coordinates: [Number(plainPost.longitude), Number(plainPost.latitude)]
            }
          };
        });
      } else {
        postsWithFavorites = rows.map(post => {
          const plainPost = post.get({ plain: true });
          return {
            ...plainPost,
            coordinates: {
              type: 'Point',
              coordinates: [Number(plainPost.longitude), Number(plainPost.latitude)]
            }
          };
        });
      }

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
      loggerUtil.error(`${_serviceName}.getPosts error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async getFavoritePosts(userId: number, page: number, limit: number) {
    try {
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
          favorites: undefined
        };
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
      loggerUtil.error(`${_serviceName}.getFavoritePosts error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async getPost(id: number, userId: number | null) {
    try {
      const post = await this.rentalPostModel.findByPk(id, {
        include: [
          {
            model: RentalImage,
            as: 'images',
          },
        ],
      });

      if (!post) {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }

      const plainPost: any = post.get({ plain: true });

      // Add favorite status if user is logged in
      if (userId) {
        const favorite = await this.favoriteListModel.findOne({
          where: {
            rentalId: id,
            userId,
          },
        });
        
        plainPost.isFavorite = !!favorite;
      }

      plainPost.coordinates = {
        type: 'Point',
        coordinates: [Number(plainPost.longitude), Number(plainPost.latitude)]
      };
      
      plainPost.address = {
        province: plainPost.province,
        district: plainPost.district,
        ward: plainPost.ward,
        street: plainPost.street
      };

      return plainPost;
    } catch (error) {
      loggerUtil.error(`${_serviceName}.getPost error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async createPost(createPostDto: CreatePostDto, userId: number) {
    try {
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
      return this.getPost(post.id, userId);
    } catch (error) {
      loggerUtil.error(`${_serviceName}.createPost error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async addFavorite(id: number, userId: number) {
    try {
      const post = await this.rentalPostModel.findByPk(id);

      if (!post) {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }

      const existingFavorite = await this.favoriteListModel.findOne({
        where: {
          rentalId: id,
          userId,
        },
      });

      if (!existingFavorite) {
        await this.favoriteListModel.create({
          rentalId: id,
          userId,
        });
      }

      return true;
    } catch (error) {
      loggerUtil.error(`${_serviceName}.addFavorite error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  async removeFavorite(id: number, userId: number) {
    try {
      const favorite = await this.favoriteListModel.findOne({
        where: {
          rentalId: id,
          userId,
        },
      });

      if (favorite) {
        await favorite.destroy();
      }

      return true;
    } catch (error) {
      loggerUtil.error(`${_serviceName}.removeFavorite error: ${error.message}`, error);
      if (error instanceof Error) {
        const message = SequelizeErrorUtil.formatSequelizeError(error);
        throw new HttpException(message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
}
