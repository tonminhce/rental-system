import { UserProfileDto } from './user-profile.dto';

export class SuggestedRoommateDto {
    profile: UserProfileDto;
    similarityScore: number;
}
