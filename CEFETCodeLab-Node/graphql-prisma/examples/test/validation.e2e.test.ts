import { createApolloServer } from '../../src/server';
import { buildContext, prisma } from '../../src/context';

describe('GraphQL (Apollo + Prisma) - validações separadas', () => {
  beforeEach(async () => {
    await prisma.atoresOnFilmes.deleteMany({});
    await prisma.generosOnFilmes.deleteMany({});
    await prisma.ator.deleteMany({});
    await prisma.genero.deleteMany({});
    await prisma.filme.deleteMany({});
  });

  it('deve criar ator', async () => {
    const server = createApolloServer();
    const ctx = await buildContext();

    const res = await server.executeOperation(
      {
        query: `mutation($input: AtorInput!) { criarAtor(input: $input) { id nome } }`,
        variables: { input: { nome: 'Keanu Reeves' } },
      },
      { contextValue: ctx }
    );

    if (res.body.kind !== 'single') throw new Error('Resultado incremental inesperado');
    const ator = (res.body.singleResult.data as any).criarAtor;
    expect(ator.id).toBeDefined();
    expect(ator.nome).toBe('Keanu Reeves');
  });

  it('deve criar gênero', async () => {
    const server = createApolloServer();
    const ctx = await buildContext();

    const res = await server.executeOperation(
      {
        query: `mutation($input: GeneroInput!) { criarGenero(input: $input) { id nome } }`,
        variables: { input: { nome: 'Ação' } },
      },
      { contextValue: ctx }
    );

    if (res.body.kind !== 'single') throw new Error('Resultado incremental inesperado');
    const genero = (res.body.singleResult.data as any).criarGenero;
    expect(genero.id).toBeDefined();
    expect(genero.nome).toBe('Ação');
  });

  it('deve criar filme', async () => {
    const server = createApolloServer();
    const ctx = await buildContext();

    const res = await server.executeOperation(
      {
        query: `mutation($input: FilmeInput!) { criarFilme(input: $input) { id titulo ano } }`,
        variables: { input: { titulo: 'Matrix', ano: 1999 } },
      },
      { contextValue: ctx }
    );

    if (res.body.kind !== 'single') throw new Error('Resultado incremental inesperado');
    const filme = (res.body.singleResult.data as any).criarFilme;
    expect(filme.id).toBeDefined();
    expect(filme.titulo).toBe('Matrix');
    expect(filme.ano).toBe(1999);
  });

  it('deve relacionar ator e gênero ao filme e consultar', async () => {
    const server = createApolloServer();
    const ctx = await buildContext();

    const criarAtor = await server.executeOperation(
      {
        query: `mutation($input: AtorInput!) { criarAtor(input: $input) { id nome } }`,
        variables: { input: { nome: 'Keanu Reeves' } },
      },
      { contextValue: ctx }
    );
    if (criarAtor.body.kind !== 'single') throw new Error('Resultado incremental inesperado ao criar ator');
    const atorId = (criarAtor.body.singleResult.data as any).criarAtor.id as string;

    const criarGenero = await server.executeOperation(
      {
        query: `mutation($input: GeneroInput!) { criarGenero(input: $input) { id nome } }`,
        variables: { input: { nome: 'Ação' } },
      },
      { contextValue: ctx }
    );
    if (criarGenero.body.kind !== 'single') throw new Error('Resultado incremental inesperado ao criar gênero');
    const generoId = (criarGenero.body.singleResult.data as any).criarGenero.id as string;

    const criarFilme = await server.executeOperation(
      {
        query: `mutation($input: FilmeInput!) { criarFilme(input: $input) { id titulo ano } }`,
        variables: { input: { titulo: 'Matrix', ano: 1999 } },
      },
      { contextValue: ctx }
    );
    if (criarFilme.body.kind !== 'single') throw new Error('Resultado incremental inesperado ao criar filme');
    const filmeId = (criarFilme.body.singleResult.data as any).criarFilme.id as string;

    const addAtor = await server.executeOperation(
      {
        query: `mutation($filmeId: ID!, $atorIds: [ID!]!) {
          adicionarAtoresEmFilme(filmeId: $filmeId, atorIds: $atorIds) { id atores { id nome } }
        }`,
        variables: { filmeId, atorIds: [atorId] },
      },
      { contextValue: ctx }
    );
    if (addAtor.body.kind !== 'single') throw new Error('Resultado incremental inesperado ao adicionar ator');
    expect((addAtor.body.singleResult.data as any).adicionarAtoresEmFilme.atores).toHaveLength(1);

    const addGenero = await server.executeOperation(
      {
        query: `mutation($filmeId: ID!, $generoIds: [ID!]!) {
          adicionarGenerosEmFilme(filmeId: $filmeId, generoIds: $generoIds) { id generos { id nome } }
        }`,
        variables: { filmeId, generoIds: [generoId] },
      },
      { contextValue: ctx }
    );
    if (addGenero.body.kind !== 'single') throw new Error('Resultado incremental inesperado ao adicionar gênero');
    expect((addGenero.body.singleResult.data as any).adicionarGenerosEmFilme.generos).toHaveLength(1);

    const getFilme = await server.executeOperation(
      {
        query: `{ filme(id: "${filmeId}") { id titulo atores { nome } generos { nome } } }`,
      },
      { contextValue: ctx }
    );
    if (getFilme.body.kind !== 'single') throw new Error('Resultado incremental inesperado ao buscar filme');
    const filme = (getFilme.body.singleResult.data as any).filme;
    expect(filme.titulo).toBe('Matrix');
    expect(filme.atores[0].nome).toBe('Keanu Reeves');
    expect(filme.generos[0].nome).toBe('Ação');
  });
});