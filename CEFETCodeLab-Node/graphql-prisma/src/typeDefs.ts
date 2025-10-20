const typeDefs = /* GraphQL */ `
  scalar DateTime

  type Filme {
    id: ID!
    titulo: String!
    ano: Int!
    atores: [Ator!]!
    generos: [Genero!]!
  }

  type Ator {
    id: ID!
    nome: String!
    filmes: [Filme!]!
  }

  type Genero {
    id: ID!
    nome: String!
    filmes: [Filme!]!
  }

  input FilmeInput {
    titulo: String!
    ano: Int!
  }

  input AtorInput {
    nome: String!
  }

  input GeneroInput {
    nome: String!
  }

  type Query {
    filmes: [Filme!]!
    filme(id: ID!): Filme
    atores: [Ator!]!
    ator(id: ID!): Ator
    generos: [Genero!]!
    genero(id: ID!): Genero
  }

  type Mutation {
    criarFilme(input: FilmeInput!): Filme!
    atualizarFilme(id: ID!, input: FilmeInput!): Filme!
    excluirFilme(id: ID!): Boolean!

    adicionarAtoresEmFilme(filmeId: ID!, atorIds: [ID!]!): Filme!
    removerAtorDeFilme(filmeId: ID!, atorId: ID!): Filme!

    criarAtor(input: AtorInput!): Ator!
    atualizarAtor(id: ID!, input: AtorInput!): Ator!
    excluirAtor(id: ID!): Boolean!

    criarGenero(input: GeneroInput!): Genero!
    adicionarGenerosEmFilme(filmeId: ID!, generoIds: [ID!]!): Filme!
  }
`;
export default typeDefs;