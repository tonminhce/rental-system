import { IsString, IsNumber, IsOptional, IsArray, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  LAND = 'land',
  OFFICE = 'office',
  ROOM = 'room',
  OTHER = 'other',
}

export enum TransactionType {
  RENT = 'rent',
  SALE = 'sale',
}

export class CreatePostDto {
  @ApiProperty({
    description: 'Name of the property',
    example: 'Beautiful Apartment in District 1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the property',
    example: 'A fully furnished apartment...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Price of the property', example: 1000000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Type of property',
    example: PropertyType.APARTMENT,
    enum: PropertyType,
  })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @ApiProperty({
    description: 'Type of transaction',
    example: TransactionType.RENT,
    enum: TransactionType,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @ApiProperty({
    description: 'URL of the original listing',
    example: 'https://example.com/listing',
  })
  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @ApiProperty({ description: 'Province/City', example: 'Ho Chi Minh City' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ description: 'District', example: 'District 1' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ description: 'Ward', example: 'Ben Nghe Ward' })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({ description: 'Street', example: 'Nguyen Hue Street' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 10.7756587 })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', example: 106.7004238 })
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Full displayed address',
    example:
      '123 Nguyen Hue Street, Ben Nghe Ward, District 1, Ho Chi Minh City',
  })
  @IsString()
  @IsOptional()
  displayedAddress?: string;

  @ApiProperty({ description: 'Number of bedrooms', example: 2 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({ description: 'Number of bathrooms', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({
    description: 'Array of image URLs',
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Area of the property', example: 100 })
  @IsNumber()
  @IsOptional()
  area?: number;

  @ApiProperty({
    description: 'Contact name for the listing',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiProperty({
    description: 'Contact phone number for the listing',
    example: '+84912345678',
  })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiProperty({
    description: 'URL of the post',
    example: 'https://example.com/post/123',
  })
  @IsString()
  @IsOptional()
  postUrl?: string;
} 