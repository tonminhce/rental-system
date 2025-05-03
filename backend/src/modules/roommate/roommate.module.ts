import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoommateService } from './roommate.service';
import { RoommateController } from './roommate.controller';
import { UserProfile } from 'src/database/entities/user-profile.entity';
import { User } from 'src/database/entities/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        SequelizeModule.forFeature([UserProfile, User]),
        ConfigModule,
    ],
    controllers: [RoommateController],
    providers: [RoommateService],
})
export class RoommateModule { }
