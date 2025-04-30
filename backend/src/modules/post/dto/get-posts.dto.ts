import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsEnum, IsString, IsLatitude, IsLongitude } from 'class-validator';
import { PropertyType, TransactionType } from './create-post.dto';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

export class GetPostsDto {
  @ApiProperty({ description: 'Page number', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ description: 'Minimum price', example: 100000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({ description: 'Maximum price', example: 5000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({ description: 'Minimum area in square meters', example: 30, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minArea?: number;

  @ApiProperty({ description: 'Maximum area in square meters', example: 200, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxArea?: number;

  @ApiProperty({ description: 'Property type', example: PropertyType.APARTMENT, required: false, enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  @Type(() => String)
  @Transform(({ value }) => value === '' ? undefined : value)
  propertyType?: PropertyType;

  @ApiProperty({ description: 'Transaction type', example: TransactionType.RENT, required: false, enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiProperty({ description: 'Province/City', example: 'Ho Chi Minh City', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ description: 'District', example: 'District 1', required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ description: 'Ward', example: 'Ben Nghe Ward', required: false })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ description: 'Minimum number of bedrooms', example: 2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBedrooms?: number;

  @ApiProperty({ description: 'Minimum number of bathrooms', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minBathrooms?: number;

  @ApiProperty({ description: 'Center latitude for radius search', example: 10.7756587, required: false })
  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  centerLat?: number;

  @ApiProperty({ description: 'Center longitude for radius search', example: 106.7004238, required: false })
  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  centerLng?: number;

  @ApiProperty({ description: 'Radius for location search in kilometers', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  radius?: number;

  @ApiProperty({ description: 'Boundary coordinates for area search [minLat, minLng, maxLat, maxLng]', required: false })
  @IsOptional()
  @IsString()
  bounds?: string;
} 