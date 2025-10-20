import { Context } from '../../src/context';

export default {
  Query: {
    filmes: (_: unknown, __: unknown, ctx: Context) =>
      ctx.prisma.filme.findMany(),
    filme: (_: unknown, args: { id: string }, ctx: Context) =>
      ctx.prisma.filme.findUnique({
        where: { id: Number(args.id) },
        include: { atores: { include: { ator: true } }, generos: { include: { genero: true } } }
      }).then((f) => {
        if (!f) return null;
        return {
          ...f,
          atores: f.atores.map((x) => x.ator),
          generos: f.generos.map((x) => x.genero),
        };
      }),
    atores: (_: unknown, __: unknown, ctx: Context) => ctx.prisma.ator.findMany(),
    ator: (_: unknown, args: { id: string }, ctx: Context) =>
      ctx.prisma.ator.findUnique({ where: { id: Number(args.id) } }),
    generos: (_: unknown, __: unknown, ctx: Context) => ctx.prisma.genero.findMany(),
    genero: (_: unknown, args: { id: string }, ctx: Context) =>
      ctx.prisma.genero.findUnique({ where: { id: Number(args.id) } }),
  },
  Mutation: {
    criarFilme: (_: unknown, args: { input: { titulo: string; ano: number } }, ctx: Context) =>
      ctx.prisma.filme.create({ data: { titulo: args.input.titulo, ano: args.input.ano } }),
    atualizarFilme: (_: unknown, args: { id: string; input: { titulo: string; ano: number } }, ctx: Context) =>
      ctx.prisma.filme.update({
        where: { id: Number(args.id) },
        data: { titulo: args.input.titulo, ano: args.input.ano },
      }),
    excluirFilme: async (_: unknown, args: { id: string }, ctx: Context) => {
      await ctx.prisma.filme.delete({ where: { id: Number(args.id) } });
      return true;
    },
    adicionarAtoresEmFilme: async (_: unknown, args: { filmeId: string; atorIds: string[] }, ctx: Context) => {
      const filmeId = Number(args.filmeId);
      await ctx.prisma.atoresOnFilmes.createMany({
        data: args.atorIds.map((id) => ({ filmeId, atorId: Number(id) }))
      });
      const f = await ctx.prisma.filme.findUnique({
        where: { id: filmeId },
        include: { atores: { include: { ator: true } }, generos: { include: { genero: true } } }
      });
      return {
        ...f!,
        atores: f!.atores.map((x) => x.ator),
        generos: f!.generos.map((x) => x.genero),
      };
    },
    removerAtorDeFilme: async (_: unknown, args: { filmeId: string; atorId: string }, ctx: Context) => {
      await ctx.prisma.atoresOnFilmes.delete({
        where: { filmeId_atorId: { filmeId: Number(args.filmeId), atorId: Number(args.atorId) } },
      });
      const f = await ctx.prisma.filme.findUnique({
        where: { id: Number(args.filmeId) },
        include: { atores: { include: { ator: true } }, generos: { include: { genero: true } } }
      });
      return {
        ...f!,
        atores: f!.atores.map((x) => x.ator),
        generos: f!.generos.map((x) => x.genero),
      };
    },
    criarAtor: (_: unknown, args: { input: { nome: string } }, ctx: Context) =>
      ctx.prisma.ator.create({ data: { nome: args.input.nome } }),
    atualizarAtor: (_: unknown, args: { id: string; input: { nome: string } }, ctx: Context) =>
      ctx.prisma.ator.update({ where: { id: Number(args.id) }, data: { nome: args.input.nome } }),
    excluirAtor: async (_: unknown, args: { id: string }, ctx: Context) => {
      await ctx.prisma.ator.delete({ where: { id: Number(args.id) } });
      return true;
    },
    criarGenero: (_: unknown, args: { input: { nome: string } }, ctx: Context) =>
      ctx.prisma.genero.create({ data: { nome: args.input.nome } }),
    adicionarGenerosEmFilme: async (_: unknown, args: { filmeId: string; generoIds: string[] }, ctx: Context) => {
      const filmeId = Number(args.filmeId);
      await ctx.prisma.generosOnFilmes.createMany({
        data: args.generoIds.map((id) => ({ filmeId, generoId: Number(id) })),
      });
      const f = await ctx.prisma.filme.findUnique({
        where: { id: filmeId },
        include: { atores: { include: { ator: true } }, generos: { include: { genero: true } } }
      });
      return {
        ...f!,
        atores: f!.atores.map((x) => x.ator),
        generos: f!.generos.map((x) => x.genero),
      };
    }
  }
};