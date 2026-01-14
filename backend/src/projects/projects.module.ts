import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ScraperProcessor } from './scraper.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraper',
    }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ScraperProcessor],
})
export class ProjectsModule {}