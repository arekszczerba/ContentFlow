import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: 6379,
      },
    }),
    ProjectsModule,
  ],
})
export class AppModule {}
