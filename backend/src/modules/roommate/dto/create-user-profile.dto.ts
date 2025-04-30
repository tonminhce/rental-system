import { IsEnum, IsBoolean, IsInt, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserProfileDto {
    @ApiProperty({ enum: ['Male', 'Female'], example: 'Male' })
    @IsEnum(['Male', 'Female'])
    gender: 'Male' | 'Female';

    @ApiProperty({ enum: ['Clean', 'Normal', 'Messy'], example: 'Clean' })
    @IsEnum(['Clean', 'Normal', 'Messy'])
    lifestyle: 'Clean' | 'Normal' | 'Messy';

    @ApiProperty({ type: Boolean, example: true })
    @IsBoolean()
    pets: boolean;

    @ApiProperty({ type: Boolean, example: false })
    @IsBoolean()
    smoking: boolean;

    @ApiProperty({ enum: ['Introvert', 'Extrovert'], example: 'Introvert' })
    @IsEnum(['Introvert', 'Extrovert'])
    personality: 'Introvert' | 'Extrovert';

    @ApiProperty({ type: Number, example: 22 })
    @IsInt()
    age: number;

    @ApiProperty({ type: String, example: '07:00', description: 'HH:mm format' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'wakeUpTime must be in HH:mm format',
    })
    wakeUpTime: string;

    @ApiProperty({ type: String, example: '23:00', description: 'HH:mm format' })
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'bedTime must be in HH:mm format',
    })
    bedTime: string;
}
