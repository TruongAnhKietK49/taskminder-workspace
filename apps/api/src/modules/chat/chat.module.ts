import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProjectsModule } from '../projects/project.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';

@Module({
  imports: [JwtModule.register({}), WorkspacesModule, ProjectsModule],
  controllers: [ChatController, PresenceController],
  providers: [ChatService, PresenceService, ChatGateway],
  exports: [ChatService, PresenceService, ChatGateway],
})
export class ChatModule {}
