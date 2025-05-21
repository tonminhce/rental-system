import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { responseUtil } from '../../shared/utils/response.util';
import { Public } from '../../shared/decorators/public.decorator';
import { IsRental } from '../../shared/decorators/is-rental.decorator';
import { RequestContext } from 'src/common/request-context';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOperation({ summary: 'Get all posts with filters and pagination' })
  @Public()
  @Get()
  async getPosts(@Query() getPostsDto: GetPostsDto, @Request() req) {
    const userId = this._getUserIdFromContext();
    const result = await this.postService.getPosts(getPostsDto, userId);
    
    return responseUtil.success({
      ...result,
      message: 'Posts retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get favorite posts of the logged-in user' })
  @ApiBearerAuth()
  @Get('favourites')
  async getFavoritePosts(@Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = this._getUserIdFromContext();
    const result = await this.postService.getFavoritePosts(userId, page, limit);
    
    return responseUtil.success({
      ...result,
      message: 'Favorite posts retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get post details by ID' })
  @Public()
  @Get(':id')
  async getPost(@Param('id') id: number) {
    const userId = this._getUserIdFromContext();
    const post = await this.postService.getPost(id, userId);
    
    return responseUtil.success({
      post,
      message: 'Post retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Create a new post (requires rental role)' })
  @ApiBearerAuth()
  @IsRental()
  @Post()
  async createPost(@Body() createPostDto: CreatePostDto) {
    const userId = this._getUserIdFromContext();
    const post = await this.postService.createPost(createPostDto, userId);
    
    return responseUtil.success({
      post,
      message: 'Post created successfully',
    });
  }

  @ApiOperation({ summary: 'Add a post to favorites' })
  @ApiBearerAuth()
  @Post(':id/favourites')
  async addFavorite(@Param('id') id: number) {
    const userId = this._getUserIdFromContext();
    await this.postService.addFavorite(id, userId);
    
    return responseUtil.success({
      message: 'Post added to favorites',
    });
  }

  @ApiOperation({ summary: 'Remove a post from favorites' })
  @ApiBearerAuth()
  @Delete(':id/favourites')
  async removeFavorite(@Param('id') id: number) {
    const userId = this._getUserIdFromContext();
    await this.postService.removeFavorite(id, userId);
    
    return responseUtil.success({
      message: 'Post removed from favorites',
    });
  }

  private _getUserIdFromContext(): number | null {
    const user = RequestContext.get('user');
    if (!user) {
      return null;
    }
    return user.id;
  }
}
