import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Template } from '../template/entities/template.entity';
import { TemplateParam } from '../template_params/entities/template_param.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const templateRepository = dataSource.getRepository(Template);
  const templateParamsRepository = dataSource.getRepository(TemplateParam);

  const title = 'Verifica criação no banco de dados';
  const templateContent = `import request from 'supertest';
    import { app, db } from './app';

    beforeAll(async () => {
    await db('$tabela$').where($dado$).del();
    });

    afterAll(async () => {
    await db('$tabela$').where($dado$).del();
    await db.destroy();
    });

    describe('Teste de cadastro', () => {
    it('deve salvar no banco de dados', async () => {
        const res = await request(app)
        .post('$rota$')
        .send($dado$);

        expect(res.status).toBe(201);

        const result = await db('$tabela$').where($dado$);
        expect(result.length).toBe(1);
        });
    });`;
  const params = ['rota', 'dado', 'tabela'];

  const templatesDir = path.join(process.cwd(), 'templates-upload');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir);
  }

  const safeName = title.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_${Date.now()}.tpl.txt`;
  const fullPath = path.join(templatesDir, filename);

  fs.writeFileSync(fullPath, templateContent, 'utf-8');

  const template = await templateRepository.save({
    title,
    description: 'Verifica no banco de dados se o dado passado por parâmetro de fato foi inserido',
    filePath: filename,
    dependencies: ["supertest", "@types/supertest"]
  });

  const paramEntities = params.map((name) =>
    templateParamsRepository.create({
      name,
      templateId: template.id,
    }),
  );

  await templateParamsRepository.save(paramEntities);

  console.log('Seed concluída com sucesso!');
  await app.close();
}
bootstrap();
