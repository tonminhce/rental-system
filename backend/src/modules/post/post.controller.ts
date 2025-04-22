import { Controller, Get, Post, Body, Param, Delete, Query,  Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { responseUtil } from '../../shared/utils/response.util';
import { Public } from '../../decorator/public.decorator';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOperation({ summary: 'Get all posts with filters and pagination' })
  @Public()
  @Get()
  async getPosts(@Query() getPostsDto: GetPostsDto, @Request() req) {
    const userId = req.user?.id || null;
    const result = await this.postService.getPosts(getPostsDto, userId);
    
    return responseUtil.success({
      ...result,
      message: 'Posts retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get favorite posts of the logged-in user' })
  @ApiBearerAuth()
  @Get('favorites')
  async getFavoritePosts(@Query('page') page = 1, @Query('limit') limit = 10, @Request() req) {
    const userId = req.user.id;
    const result = await this.postService.getFavoritePosts(userId, page, limit);
    
    return responseUtil.success({
      ...result,
      message: 'Favorite posts retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get post details by ID' })
  @Public()
  @Get(':id')
  async getPost(@Param('id') id: number, @Request() req) {
    const userId = req.user?.id || null;
    const post = await this.postService.getPost(id, userId);
    
    return responseUtil.success({
      post,
      message: 'Post retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Create a new post' })
  @ApiBearerAuth()
  @Post()
  async createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
    const userId = req.user.id;
    const post = await this.postService.createPost(createPostDto, userId);
    
    return responseUtil.success({
      post,
      message: 'Post created successfully',
    });
  }

  @ApiOperation({ summary: 'Add a post to favorites' })
  @ApiBearerAuth()
  @Post(':id/favorite')
  async addFavorite(@Param('id') id: number, @Request() req) {
    const userId = req.user.id;
    await this.postService.addFavorite(id, userId);
    
    return responseUtil.success({
      message: 'Post added to favorites',
    });
  }

  @ApiOperation({ summary: 'Remove a post from favorites' })
  @ApiBearerAuth()
  @Delete(':id/favorite')
  async removeFavorite(@Param('id') id: number, @Request() req) {
    const userId = req.user.id;
    await this.postService.removeFavorite(id, userId);
    
    return responseUtil.success({
      message: 'Post removed from favorites',
    });
  }
} 