export class UserProfileDto {
    id: number;
    userId: number;
    gender: 'Male' | 'Female';
    lifestyle: 'Clean' | 'Normal' | 'Messy';
    pets: boolean;
    smoking: boolean;
    personality: 'Introvert' | 'Extrovert';
    age: number;
    wakeUpTime: string;
    bedTime: string;
    totalScore: number;
    createdAt: Date;
    updatedAt: Date;
}
