import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/project.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [WorkspacesModule, ProjectsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
