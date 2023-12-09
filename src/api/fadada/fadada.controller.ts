import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Inject } from '@nestjs/common';
import { FadadaService } from './fadada.service';
import { CreateFadadaDto } from './dto/create-fadada.dto';
import { UpdateFadadaDto } from './dto/update-fadada.dto';
import { UploadFadadaDto } from './dto/fadadaUpload';
import { FileProcess } from './dto/fileProcess';
import { fileVerify } from './dto/fileVerifySignDto';
import { SignTask } from './dto/fadadaSignTask.dto';

import { SocketService } from 'src/socket/socket.service';

import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { query } from 'express';
import { RedisCacheApi } from '@src/decorators';

@ApiTags('法大大电子签章')
@Controller('fadada')
export class FadadaController {
  constructor(private readonly fadadaService: FadadaService, private readonly SocketService: SocketService) { }

  @Post('/getToken')
  getToken() {
    return this.fadadaService.getToken();
  }
  @Post('/corp/get')
  getCorp() {
    return this.fadadaService.corpGet();
  }

  @Post('/corp/getIdentity')
  corpGetIdentity() {
    return this.fadadaService.corpGetIdentity();
  }

  @Post('/member/GetList')
  corpGetIList() {
    return this.fadadaService.corpGetList();
  }

  @Post('/user/GetAuthUrl')
  @ApiOperation({ summary: '获取用户绑定链接' })
  async userAuthUrl(@Body() data: UpdateFadadaDto) {
    return this.fadadaService.getUserAuthUrl(data);
  }
  @Get('/user/GetAuthUrl')
  @ApiOperation({ summary: '验证用户绑定回调' })
  AuthUrl(@Query('clientUserId') clientUserId: string, @Query('openUserId') openUserId: string, @Query('authResult') authResult: string, @Query('authFailedReason') authFailedReason: string) {
    return this.fadadaService.UserAuthUrl(clientUserId, openUserId, authResult, authFailedReason);
  }
  @Get('/submitCallback')
  @ApiOperation({ summary: '验证用户绑定回调' })
  submitCallback(@Query() data) {
    return this.fadadaService.submitCallback(data);
  }

  @Post('/user/disable')
  @ApiOperation({ summary: '暂时关闭用户' })
  userdisable(@Body() data) {
    return this.fadadaService.userDisable(data);
  }
  @Post('/user/Enable')
  @ApiOperation({ summary: '开启用户' })
  userEnable(@Body() data) {
    return this.fadadaService.userEnable(data);
  }
  @Post('/user/Unbind')
  @ApiOperation({ summary: '解绑用户' })
  userUnbind(@Body() data) {
    return this.fadadaService.userUnbind(data);
  }

  @Post('/user/Get')
  @ApiOperation({ summary: '获取用户信息' })
  userGet(@Body() data: CreateFadadaDto) {
    return this.fadadaService.userGet(data);
  }
  @Get('/user/GetByClientUserId')
  @RedisCacheApi({ exSecond: null })
  @ApiOperation({ summary: '获取openUserId' })
  GetByClientUserId(@Query('ClientUserId') ClientUserId: string) {
    return this.fadadaService.getopenUserId(ClientUserId);
  }
  @Post('/user/GetIdentity')
  @ApiOperation({ summary: '获取用户授权信息' })
  userGetIdentity(@Body() data: CreateFadadaDto) {
    return this.fadadaService.userGetIdentity(data);
  }
  @Post('/doc/getUploadLink')
  @ApiOperation({ summary: '获取上传连接' })
  getUploadLink(@Body() data: UploadFadadaDto) {
    return this.fadadaService.uploadDoc(data);
  }
  @Post('/doc/uploadFileByUrl')
  @ApiOperation({ summary: '通过网络连接上传' })
  uploadFileByUrl(@Body() data) {
    return this.fadadaService.uploadFileByUrl(data);
  }
  @Post('/doc/fileProcess')
  @ApiOperation({ summary: '文件处理' })

  fileProcess(@Body() data: FileProcess) {
    return this.fadadaService.fileProcess(data);
  }

  @Post('/doc/fileVerifySign')
  @ApiOperation({ summary: '文件验签', description: '文件验签' })
  fileVerifySign(@Body() data: fileVerify) {
    return this.fadadaService.fileVerifySign(data);
  }

  @Post('/sign/Create')
  @ApiOperation({ summary: '创建签署任务' })
  signCreate(@Body() data: fileVerify) {
    return this.fadadaService.signCreate(data);
  }
  @Post('/sign/CreateWithTemple')
  @ApiOperation({ summary: '创建签署任务(基于签署任务模板) ' })
  signCreateWithTemple(@Body() data) {
    return this.fadadaService.signCreateWithTemple(data);
  }
  @Post('/sign/AddDoc')
  @ApiOperation({ summary: '添加签署任务文档' })
  signAddDoc(@Body() data) {
    return this.fadadaService.signAddDoc(data);
  }
  @Post('/sign/deleteDoc')
  @ApiOperation({ summary: '移除签署任务文档' })
  signdeleteDoc(@Body() data) {
    return this.fadadaService.signdeleteDoc(data);
  }
  @Post('/sign/addFiele')
  @ApiOperation({ summary: '添加签署任务控件' })
  signaddFiele(@Body() data) {
    return this.fadadaService.signaddFiele(data);
  }
  @Post('/sign/deleteFiele')
  @ApiOperation({ summary: '移除签署任务控件' })
  signdeleteFiele(@Body() data) {
    return this.fadadaService.signdeleteFiele(data);
  }
  @Post('/sign/fillFieldValues')
  @ApiOperation({ summary: '填写签署任务控件内容' })
  fillFieldValues(@Body() data) {
    return this.fadadaService.fillFieldValues(data);
  }
  @Post('/sign/addAttach')
  @ApiOperation({ summary: '添加签署任务附件' })
  addAttach(@Body() data) {
    return this.fadadaService.addAttach(data);
  }
  @Post('/sign/deleteAttach')
  @ApiOperation({ summary: '移除签署任务附件' })
  deleteAttach(@Body() data) {
    return this.fadadaService.deleteAttach(data);
  }
  @Post('/sign/addActor')
  @ApiOperation({ summary: '添加签署任务参与方' })
  addActor(@Body() data) {
    return this.fadadaService.addActor(data);
  }
  @Post('/sign/deleteActor')
  @ApiOperation({ summary: '移除签署任务参与方' })
  deleteActor(@Body() data) {
    return this.fadadaService.deleteActor(data);
  }
  @Post('/sign/modifyActor')
  @ApiOperation({ summary: '修改签署任务参与方' })
  modifyActor(@Body() data) {
    return this.fadadaService.modifyActor(data);
  }
  @Post('/sign/getSignTaskEditUrl')
  @ApiOperation({ summary: '获取签署任务编辑链接' })
  getSignTaskEditUrl(@Body() data: SignTask) {
    return this.fadadaService.getSignTaskEditUrl(data);
  }
  @Post('/sign/getSignTaskPreviewUrl')
  @ApiOperation({ summary: '获取签署任务预览链接' })
  getSignTaskPreviewUrl(@Body() data: SignTask) {
    return this.fadadaService.getSignTaskPreviewUrl(data);
  }
  @Post('/sign/getActorUrl')
  @ApiOperation({ summary: '获取参与方签署链接' })
  getActorUrl(@Body() data: SignTask) {
    return this.fadadaService.getActorUrl(data);
  }
  @Post('/sign/getActorBatchSignTaskUrl')
  @ApiOperation({ summary: '获取参与方批量签署链接' })
  getActorBatchSignTaskUrl(@Body() data: SignTask) {
    return this.fadadaService.getActorBatchSignTaskUrl(data);
  }
  @Post('/sign/getV3ActorSignTaskUrl')
  @ApiOperation({ summary: '获取参与方签署链接（API3.0任务专属）' })
  getV3ActorSignTaskUrl(@Body() data: SignTask) {
    console.log(data)
    return this.fadadaService.getV3ActorSignTaskUrl(data);
  }
  @Post('/sign/Start')
  @ApiOperation({ summary: '提交签署任务' })
  signStart(@Body() data: SignTask) {
    return this.fadadaService.signStart(data);
  }
  @Post('/sign/Cancel')
  @ApiOperation({ summary: '撤销签署任务' })
  signCancel(@Body() data: SignTask) {
    return this.fadadaService.signCancel(data);
  }
  @Post('/sign/finalizeDoc')
  @ApiOperation({ summary: '定稿签署任务' })
  finalizeDoc(@Body() data: SignTask) {
    return this.fadadaService.finalizeDoc(data);
  }
  @Post('/sign/urgeSignTask')
  @ApiOperation({ summary: '催办签署任务' })
  urgeSignTask(@Body() data: SignTask) {
    return this.fadadaService.urgeSignTask(data);
  }
  @Post('/sign/block')
  @ApiOperation({ summary: '阻塞签署任务' })
  signblock(@Body() data: SignTask) {
    return this.fadadaService.signblock(data);
  }
  @Post('/sign/Unblock')
  @ApiOperation({ summary: '解阻签署任务' })
  signUnblock(@Body() data: SignTask) {
    return this.fadadaService.signUnblock(data);
  }
  @Post('/sign/finish')
  @ApiOperation({ summary: '结束签署任务' })
  signfinish(@Body() data: SignTask) {
    return this.fadadaService.signfinish(data);
  }
  @Post('/sign/Abolish')
  @ApiOperation({ summary: '作废签署任务' })
  signAbolish(@Body() data: SignTask) {
    return this.fadadaService.signAbolish(data);
  }
  @Post('/sign/GetDetail')
  @ApiOperation({ summary: '查询签署任务详情' })
  signGetDetail(@Body() data: SignTask) {
    return this.fadadaService.signGetDetail(data);
  }
  @Post('/sign/GetOwnerList')
  @ApiOperation({ summary: '查询签署任务列表' })
  signGetOwnerList(@Body() data) {
    return this.fadadaService.signGetOwnerList(data);
  }
  @Post('/sign/GetOwnerDownLoadUrl')
  @ApiOperation({ summary: '获取签署文档下载地址' })
  signGetOwnerDownLoadUrl(@Body() data) {
    return this.fadadaService.signGetOwnerDownLoadUrl(data);
  }
}
