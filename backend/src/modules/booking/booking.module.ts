import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from 'src/database/entities/booking.entity';

@Module({
    imports: [SequelizeModule.forFeature([Booking])],
    controllers: [BookingController],
    providers: [BookingService],
    exports: [BookingService],
})
export class BookingModule { }
