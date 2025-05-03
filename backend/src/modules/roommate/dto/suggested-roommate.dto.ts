import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from './user-profile.dto';

export class SuggestedRoommateDto {
    @ApiProperty({ type: UserProfileDto })
    profile: UserProfileDto;

    @ApiProperty({ example: 0.7 })
    similarityScore: number;
}
