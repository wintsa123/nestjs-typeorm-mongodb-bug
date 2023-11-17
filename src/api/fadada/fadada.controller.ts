import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FadadaService } from './fadada.service';
import { CreateFadadaDto } from './dto/create-fadada.dto';
import { UpdateFadadaDto } from './dto/update-fadada.dto';
import { UploadFadadaDto } from './dto/fadadaUpload';
import { FileProcess } from './dto/fileProcess';
import { fileVerify } from './dto/fileVerifySignDto';

import { ApiTags,ApiOperation } from '@nestjs/swagger';

@ApiTags('fadada')
@Controller('fadada')
export class FadadaController {
  constructor(private readonly fadadaService: FadadaService) { }

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

  userAuthUrl(@Body() data: UpdateFadadaDto) {
    return this.fadadaService.getUserAuthUrl(data);
  }
  @Post('/user/disable')
  @ApiOperation({ summary: '暂时关闭用户' })

  userdisable(@Body() data: CreateFadadaDto) {
    return this.fadadaService.userDisable(data);
  }
  @Post('/user/Enable')
  @ApiOperation({ summary: '开启用户' })

  userEnable(@Body() data: CreateFadadaDto) {
    return this.fadadaService.userEnable(data);
  }
  @Post('/user/Unbind')
  @ApiOperation({ summary: '解绑用户' })

  userUnbind(@Body() data: CreateFadadaDto) {
    return this.fadadaService.userUnbind(data);
  }

  @Post('/user/Get')
  @ApiOperation({ summary: '获取用户信息' })

  userGet(@Body() data: CreateFadadaDto) {
    return this.fadadaService.userGet(data);
  }
  @Post('/user/GetIdentity')
  userGetIdentity(@Body() data: CreateFadadaDto) {
    return this.fadadaService.userGetIdentity(data);
  }
  @Post('/doc/getUploadLink')
  @ApiOperation({ summary: '获取上传连接', description: '获取上传连接' })
  getUploadLink(@Body() data: UploadFadadaDto) {
    return this.fadadaService.uploadDoc(data);
  }
  @Post('/doc/uploadFileByUrl')
  @ApiOperation({ summary: '获取上传连接', description: '获取上传连接' })
  uploadFileByUrl(@Body() data: UploadFadadaDto) {
    return this.fadadaService.uploadFileByUrl(data);
  }
  @Post('/doc/fileProcess')
  @ApiOperation({ summary: '文件处理', description: '文件上传后处理' })

  fileProcess(@Body() data: FileProcess) {
    return this.fadadaService.fileProcess(data);
  }

  @Post('/doc/fileVerifySign')
  @ApiOperation({ summary: '文件验签', description: '文件验签' })
  fileVerifySign(@Body() data:fileVerify) {
    return this.fadadaService.fileVerifySign(data);
  }

  @Post('/sign/Create')
  @ApiOperation({ summary: '创建签署任务' })
  signCreate(@Body() data) {
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
  getSignTaskEditUrl(@Body() data) {
    return this.fadadaService.getSignTaskEditUrl(data);
  }
  @Post('/sign/getSignTaskPreviewUrl')
  @ApiOperation({ summary: '获取签署任务预览链接' })
  getSignTaskPreviewUrl(@Body() data) {
    return this.fadadaService.getSignTaskPreviewUrl(data);
  }
  @Post('/sign/getActorUrl')
  @ApiOperation({ summary: '获取参与方签署链接' })
  getActorUrl(@Body() data) {
    return this.fadadaService.getActorUrl(data);
  }
  @Post('/sign/getActorBatchSignTaskUrl')
  @ApiOperation({ summary: '获取参与方批量签署链接' })
  getActorBatchSignTaskUrl(@Body() data) {
    return this.fadadaService.getActorBatchSignTaskUrl(data);
  }
  @Post('/sign/getV3ActorSignTaskUrl')
  @ApiOperation({ summary: '获取参与方签署链接（API3.0任务专属）' })
  getV3ActorSignTaskUrl(@Body() data) {
    return this.fadadaService.getV3ActorSignTaskUrl(data);
  }
  @Post('/sign/Start')
  @ApiOperation({ summary: '提交签署任务' })
  signStart(@Body() data) {
    return this.fadadaService.signStart(data);
  }
  @Post('/sign/Cancel')
  @ApiOperation({ summary: '撤销签署任务' })
  signCancel(@Body() data) {
    return this.fadadaService.signCancel(data);
  }
  @Post('/sign/finalizeDoc')
  @ApiOperation({ summary: '定稿签署任务' })
  finalizeDoc(@Body() data) {
    return this.fadadaService.finalizeDoc(data);
  }
  @Post('/sign/urgeSignTask')
  @ApiOperation({ summary: '催办签署任务' })
  urgeSignTask(@Body() data) {
    return this.fadadaService.urgeSignTask(data);
  }
  @Post('/sign/block')
  @ApiOperation({ summary: '阻塞签署任务' })
  signblock(@Body() data) {
    return this.fadadaService.signblock(data);
  }
  @Post('/sign/Unblock')
  @ApiOperation({ summary: '解阻签署任务' })
  signUnblock(@Body() data) {
    return this.fadadaService.signUnblock(data);
  }
  @Post('/sign/finish')
  @ApiOperation({ summary: '结束签署任务' })
  signfinish(@Body() data) {
    return this.fadadaService.signfinish(data);
  }
  @Post('/sign/Abolish')
  @ApiOperation({ summary: '作废签署任务' })
  signAbolish(@Body() data) {
    return this.fadadaService.signAbolish(data);
  }
  @Post('/sign/GetDetail')
  @ApiOperation({ summary: '查询签署任务详情' })
  signGetDetail(@Body() data) {
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