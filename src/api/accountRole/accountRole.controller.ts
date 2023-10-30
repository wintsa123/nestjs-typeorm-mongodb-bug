import { Controller, Get, Post, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, ICurrentUserType } from '@src/decorators';
import { AuthGuard } from '@src/guard/auth.guard';
import { RoleEntity } from '../role/entities/role.entity';
import { AccountRoleService } from './accountRole.service';
import { AccountRoleDto } from './dto/account.role.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('admin')
@UseGuards(AuthGuard)
@Controller('accountRole')
export class AccountRoleController {
  constructor(private readonly accountRoleService: AccountRoleService) {}

  @Post()
  async distributionRoleApi(@Body() req: AccountRoleDto): Promise<string> {
    return await this.accountRoleService.distributionRoleApi(req);
  }

  @Get(':accountId')
  async getRoleByAccountIdApi(
    @Param('accountId', new ParseIntPipe()) accountId: number
  ): Promise<RoleEntity[]> {
    return await this.accountRoleService.getRoleByAccountIdApi(accountId);
  }

  @Get()
  async getAllRolesApi(
    @Query('status') status: number,
    @CurrentUser('userInfo') currentInfo: ICurrentUserType
  ): Promise<RoleEntity[]> {
    return await this.accountRoleService.getAllRolesApi(status, currentInfo);
  }
}
