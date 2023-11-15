import { Injectable } from '@nestjs/common';
import { CreateFadadaDto } from './dto/create-fadada.dto';
import { UpdateFadadaDto } from './dto/update-fadada.dto';
import { Fadada } from './entities/fadada.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import oracledb from 'oracledb';
import * as fascOpenApi from '@fddnpm/fasc-openapi-node-sdk';
// import  clientConfig  from '@fddnpm/fasc-openapi-node-sdk';

@Injectable()
export class FadadaService {
  constructor(

  ) { }
  async create() {
    const UserClient = fascOpenApi.userClient.Client;

    const client = new fascOpenApi.serviceClient.Client({
      credential: { appId: "80000470", appSecret: "FQCLPQRNNIZXVLX1NQDBS10DUZJ8HNFQ" },
      serverUrl: "https://uat-api.fadada.com/api/v5",
    })
    const token: any = await client.getAccessToken()
    if (token.status !== 200) {
      return 'token fail'
    }
    console.log('tokne', token)
    return token.data.data.accessToken;
  }

  findAll() {
    return '.find()';
  }

  findOne(id: number) {
    return id;
  }

  update(id: number, data: any) {
    return { id, data };
  }

  delete(id: number) {
    return id;
  }
}
