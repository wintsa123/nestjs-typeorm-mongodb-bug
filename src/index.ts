import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

// 示例：查询所有用户
async function getAllUsers() {
    const users = await prisma.user.findMany();
    console.log(users);
}
async function main() {
    await prisma.user.create({
        data: {
            name: 'Rich',
            phone: '17666503623',
            password:'12300114',
            role :'1'
        },
    })
    const result =await prisma.user.findMany()
    console.log(result)
}

main();