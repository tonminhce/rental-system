import {
  Controller,
  Get,
  Param,
  Body,
  ParseIntPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoommateService } from './roommate.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { responseUtil } from 'src/shared/utils/response.util';
import { Public } from 'src/shared/decorators/public.decorator';
import { RequestContext } from 'src/common/request-context';

@ApiTags('Roommate')
@Controller('roommate')
export class RoommateController {
  constructor(private readonly roommateService: RoommateService) {}

  @ApiOperation({ summary: 'Get all user profiles (roommate)' })
  @ApiBearerAuth()
  @Public()
  @Get()
  async getAllProfiles(): Promise<any> {
    const profiles = await this.roommateService.getAllProfiles();
    return responseUtil.success({
      profiles,
      message: 'User profiles retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get roommate suggestions for current user' })
  @ApiBearerAuth()
  @Get('suggestions')
  async getSuggestions(): Promise<any> {
    const userId = this._getUserIdFromContext();
    const suggestions =
      await this.roommateService.getRoommateSuggestions(userId);
    return responseUtil.success({
      suggestions,
      message: 'Roommate suggestions retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiBearerAuth()
  @Get(':id')
  async getProfileById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const profile = await this.roommateService.getProfileById(id);
    return responseUtil.success({
      profile,
      message: 'Profile retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @Get('profile/me')
  async getMyProfile(): Promise<any> {
    const userId = this._getUserIdFromContext();
    const profile = await this.roommateService.getProfileByUserId(userId);
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
  ): Promise<any> {
    const userId = this._getUserIdFromContext();
    const profile = await this.roommateService.createProfile(
      userId,
      createUserProfileDto,
    );
    return responseUtil.success({
      profile,
      message: 'Profile created successfully',
    });
  }

  private _getUserIdFromContext(): number {
    const user = RequestContext.get('user');
    if (!user) {
      throw new UnauthorizedException('User not found in request context');
    }
    return user.id;
  }
}
