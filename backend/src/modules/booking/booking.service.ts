import {
    Injectable,
    NotFoundException,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Booking } from 'src/database/entities/booking.entity';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingRequestStatus } from 'src/database/entities/booking.entity';
import { loggerUtil } from 'src/shared/utils/log.util';
import { SequelizeErrorUtil } from 'src/utils/sequelize-error.util';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { RentalPost } from 'src/database/entities/rental-post.entity';

const _serviceName = 'BookingService';

@Injectable()
export class BookingService {
    constructor(
        @InjectModel(Booking)
        private readonly bookingModel: typeof Booking,
    ) { }

    async createBookingRequest(dto: CreateBookingRequestDto, userId: number) {
        try {
            const booking = await this.bookingModel.create({
                postId: dto.postId,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                userId,
                status: BookingRequestStatus.PENDING,
            });

            return booking;
        } catch (error) {
            loggerUtil.error(`${_serviceName}.createBookingRequest error: ${error.message}`, error);
            throw new HttpException(
                SequelizeErrorUtil.formatSequelizeError(error),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    async getUserBookingRequests(userId: number) {
        try {
            return await this.bookingModel.findAll({
                where: { userId },
                include: [{ model: RentalPost, as: 'rentalPost' }]
            });
        } catch (error) {
            loggerUtil.error(`${_serviceName}.getUserBookingRequests error: ${error.message}`, error);
            throw new HttpException(
                SequelizeErrorUtil.formatSequelizeError(error),
                HttpStatus.BAD_REQUEST,
            );
        }
    }


    async getRequestsForPost(postId: number) {
        try {
            return await this.bookingModel.findAll({
                where: { postId },
                include: ['user'],
            });
        } catch (error) {
            loggerUtil.error(`${_serviceName}.getRequestsForPost error: ${error.message}`, error);
            throw new HttpException(
                SequelizeErrorUtil.formatSequelizeError(error),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    async updateBookingStatus(id: number, dto: UpdateBookingStatusDto) {
        try {
            const booking = await this.bookingModel.findByPk(id);
            if (!booking) {
                throw new NotFoundException('Booking request not found');
            }

            booking.status = dto.status;
            await booking.save();
            return booking;
        } catch (error) {
            loggerUtil.error(`${_serviceName}.updateBookingStatus error: ${error.message}`, error);
            throw new HttpException(
                SequelizeErrorUtil.formatSequelizeError(error),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    async remove(id: number) {
        try {
            const booking = await this.bookingModel.findByPk(id);
            if (!booking) {
                throw new NotFoundException('Booking request not found');
            }
            await booking.destroy();
        } catch (error) {
            loggerUtil.error(`${_serviceName}.remove error: ${error.message}`, error);
            throw new HttpException(
                SequelizeErrorUtil.formatSequelizeError(error),
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
