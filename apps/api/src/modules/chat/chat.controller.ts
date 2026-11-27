import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('workspaces/:workspaceId/conversations')
  async listConversations(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const conversations = await this.chatService.listConversations(
      workspaceId,
      user.id,
    );

    return {
      success: true,
      message: 'Conversations retrieved successfully',
      data: { conversations },
    };
  }

  @Post('workspaces/:workspaceId/conversations/direct')
  async createDirectConversation(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateDirectConversationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const conversation = await this.chatService.ensureDirectConversation(
      workspaceId,
      user.id,
      dto.targetUserId,
    );

    return {
      success: true,
      message: 'Direct conversation ready',
      data: { conversation },
    };
  }

  @Get('conversations/:conversationId/messages')
  async listMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: QueryMessagesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.chatService.listMessages(
      conversationId,
      user.id,
      query,
    );

    return {
      success: true,
      message: 'Messages retrieved successfully',
      data: result,
    };
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.chatService.sendMessage(
      conversationId,
      user.id,
      dto.content,
    );

    this.chatGateway.emitNewMessage({
      message: result.message,
      workspaceId: result.workspaceId,
      conversationId: result.conversationId,
      recipientUserIds: result.recipientUserIds,
    });

    return {
      success: true,
      message: 'Message sent successfully',
      data: { message: result.message },
    };
  }

  @Patch('conversations/:conversationId/messages/:messageId')
  async editMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.chatService.editMessage(
      conversationId,
      messageId,
      user.id,
      dto.content,
    );

    this.chatGateway.emitUpdatedMessage(result.conversationId, result.message);

    return {
      success: true,
      message: 'Message updated successfully',
      data: { message: result.message },
    };
  }

  @Delete('conversations/:conversationId/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.chatService.deleteMessage(
      conversationId,
      messageId,
      user.id,
    );

    this.chatGateway.emitDeletedMessage(result.conversationId, result.message);

    return {
      success: true,
      message: 'Message deleted successfully',
      data: { message: result.message },
    };
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.chatService.markAsRead(conversationId, user.id);

    this.chatGateway.emitConversationRead(
      result.conversationId,
      result.userId,
      result.lastReadAt,
    );

    return {
      success: true,
      message: 'Conversation marked as read',
      data: result,
    };
  }
}
