import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoommateService } from './roommate.service';
import { UserProfile } from 'src/database/entities/user-profile.entity';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { responseUtil } from 'src/shared/utils/response.util';
import { Public } from 'src/shared/decorators/public.decorator';

@ApiTags('Roommate')
@Controller('roommate')
export class RoommateController {
    constructor(private readonly roommateService: RoommateService) { }

    @ApiOperation({ summary: 'Get all user profiles (roommate)' })
    @Public()
    @Get()
    async getAllProfiles(): Promise<any> {
        const profiles = await this.roommateService.getAllProfiles();
        return responseUtil.success({
            profiles,
            message: 'User profiles retrieved successfully',
        });
    }

    @ApiOperation({ summary: 'Get roommate suggestions for user' })
    @Public()
    @Get('suggestions/:userId')
    async getSuggestions(
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<any> {
        const suggestions = await this.roommateService.getRoommateSuggestions(userId);
        return responseUtil.success({
            suggestions,
            message: 'Roommate suggestions retrieved successfully',
        });
    }

    @ApiOperation({ summary: 'Get user profile by ID' })
    @Public()
    @Get(':id')
    async getProfileById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<any> {
        const profile = await this.roommateService.getProfileById(id);
        return responseUtil.success({
            profile,
            message: 'Profile retrieved successfully',
        });
    }

    @ApiOperation({ summary: 'Create user profile for roommate matching' })
    @ApiBearerAuth()
    @Post()
    async createProfile(
        @Body() createUserProfileDto: CreateUserProfileDto,
        @Request() req,
    ): Promise<any> {
        const userId = req.user.id;
        const profile = await this.roommateService.createProfile(userId, createUserProfileDto);
        return responseUtil.success({
            profile,
            message: 'Profile created successfully',
        });
    }
}
