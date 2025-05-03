import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Delete,
    Request,
    HttpCode,
    HttpStatus,
    Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { responseUtil } from '../../shared/utils/response.util';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @ApiOperation({ summary: 'Create a new booking request' })
    @ApiBearerAuth()
    @Post()
    async createBooking(
        @Body() createBookingDto: CreateBookingRequestDto,
        @Request() req,
    ) {
        const userId = req.user.id;
        const booking = await this.bookingService.createBookingRequest(
            createBookingDto,
            userId,
        );

        return responseUtil.success({
            booking,
            message: 'Booking request created successfully',
        });
    }

    @ApiOperation({ summary: 'Get booking requests of current user' })
    @ApiBearerAuth()
    @Get('my')
    async getUserBookings(@Request() req) {
        const userId = req.user.id;
        const bookings = await this.bookingService.getUserBookingRequests(userId);

        return responseUtil.success({
            bookings,
            message: 'User booking requests retrieved successfully',
        });
    }

    @ApiOperation({ summary: 'Get all booking requests for a post' })
    @ApiBearerAuth()
    @Get('post/:postId')
    async getPostBookings(@Param('postId') postId: number) {
        const bookings = await this.bookingService.getRequestsForPost(postId);

        return responseUtil.success({
            bookings,
            message: 'Booking requests for post retrieved successfully',
        });
    }

    @ApiOperation({ summary: 'Update booking status' })
    @ApiBearerAuth()
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: number,
        @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    ) {
        const booking = await this.bookingService.updateBookingStatus(
            id,
            updateBookingStatusDto,
        );

        return responseUtil.success({
            booking,
            message: 'Booking status updated successfully',
        });
    }

    @ApiOperation({ summary: 'Delete a booking request' })
    @ApiBearerAuth()
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBooking(@Param('id') id: number) {
        await this.bookingService.remove(id);
        return responseUtil.success({
            message: 'Booking request deleted successfully',
        });
    }
}
