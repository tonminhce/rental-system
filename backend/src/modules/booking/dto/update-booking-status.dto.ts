import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingRequestStatus } from 'src/database/entities/booking.entity';

export class UpdateBookingStatusDto {
    @ApiProperty({
        description: 'New status of the booking',
        enum: BookingRequestStatus,
        example: BookingRequestStatus.CONFIRMED,
    })
    @IsEnum(BookingRequestStatus)
    status: BookingRequestStatus;
}
