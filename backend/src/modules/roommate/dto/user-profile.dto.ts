import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
    @ApiProperty({ example: 'John Doe' })
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    email: string;

    @ApiProperty({ example: '1234567890' })
    phone: string;

    @ApiProperty({ example: 'Male' })
    gender: string;

    @ApiProperty({ example: 'Clean' })
    lifestyle: string;

    @ApiProperty({ example: true })
    pets: boolean;

    @ApiProperty({ example: false })
    smoking: boolean;

    @ApiProperty({ example: 'Introvert' })
    personality: string;

    @ApiProperty({ example: 22 })
    age: number;

    @ApiProperty({ example: '07:00' })
    wakeUpTime: string;

    @ApiProperty({ example: '23:00' })
    bedTime: string;

    @ApiProperty({ example: 85 })
    totalScore: number;

    @ApiProperty({ example: 'https://example.com/avatar.jpg' })
    avatarUrl: string;
}
