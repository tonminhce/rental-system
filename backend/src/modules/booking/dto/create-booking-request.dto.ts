import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBookingRequestDto {
  @ApiProperty({
    description: 'ID of the rental post to book',
    example: 12,
  })
  @IsInt()
  postId: number;

  @ApiProperty({
    description: 'Start date of the booking (YYYY-MM-DD)',
    example: '2025-05-10',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date of the booking (YYYY-MM-DD)',
    example: '2025-05-15',
  })
  @IsDateString()
  endDate: string;
}
