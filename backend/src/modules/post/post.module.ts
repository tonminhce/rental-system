import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { RentalPost } from '../../database/entities/rental-post.entity';
import { FavoriteList } from '../../database/entities/favorite-list.entity';
import { RentalImage } from '../../database/entities/rental-image.entity';
import { User } from '../../database/entities/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forFeature([RentalPost, FavoriteList, RentalImage, User]),
    ConfigModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {} 