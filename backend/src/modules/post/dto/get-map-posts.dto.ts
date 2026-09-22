import { IsString, Matches } from 'class-validator';
import { GetPostsDto } from './get-posts.dto';

export class GetMapPostsDto extends GetPostsDto {
  @IsString()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  mapBounds: string;
}
