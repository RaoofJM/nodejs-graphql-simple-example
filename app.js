const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");
const { json } = require("body-parser");
const validator = require("validator");

const { GraphQLError } = require("graphql");

const User = require("./model/user");
const Comment = require("./model/comment");
const Article = require("./model/article");

const app = express();

app.use(json());
app.use(cors({ origin: "*" }));

mongoose.connect(`mongodb://localhost/graphql-project`);

let typeDefs = `
  schema {
    query: Query
    mutation: Mutation
  }

  type Query {
    getAllUser(page: Int, limit: Int): userData
    getUser(id: ID!): User
  }

  type Mutation {
    createUser(input: UserInput): User!
  }

  type User {
    fname: String
    lname: String
    age: Int
    gender: Gender
    email: String
    passwor: String
    articles: [Article]
  }

  type Paginate {
    total: Int
    limit: Int
    page: Int
    pages: Int
  }

  type userData {
    users: [User]
    paginate: Paginate
  }

  type Post {
    user: ID
    title: String
    body: String
  }

  enum Gender {
    Male
    Female
  }

  type Comment {
    user: User
    article: Article
    title: String
    body: String
  }

  type Article {
    user: User
    title: String
    body: String
    comments: [Comment]
  }

  input UserInput {
    fname: String!
    lname: String!
    age: Int!
    gender: Gender!
    email: String!
    password: String!
  }
`;

let resolvers = {
  Query: {
    getAllUser: async (parent, args) => {
      let page = args.page || 1;
      let limit = args.limit || 10;
      const users = await User.paginate({}, { page, limit });
      return {
        users: users.docs,
        paginate: {
          total: users.total,
          limit: users.limit,
          page: users.page,
          pages: users.pages,
        },
      };
    },

    getUser: async (parent, args) => {
      const user = await User.findById(args.id);
      return user;
    },
  },
  Mutation: {
    createUser: async (parent, args) => {
      const salt = bcrypt.genSaltSync(15);
      const hash = bcrypt.hashSync(args.input.password, salt);

      let errors = [];
      if (validator.isEmpty(args.input.fname)) {
        errors.push({ message: "name is required" });
      }

      if (errors.length > 0) {
        const error = new Error("Invaid Inputg");
        error.data = errors;
        error.code = 404;
        throw new GraphQLError("sss", { extensions: {} });
      }
      const user = new User({
        fname: args.input.fname,
        lname: args.input.lname,
        age: args.input.age,
        gender: args.input.gender,
        email: args.input.email,
        password: hash,
      });

      await user.save();
      return user;
    },
  },

  User: {
    articles: async (parent, args) => await Article.find({ user: parent.id }),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.start().then(() => {
  app.use(expressMiddleware(server));
});

app.listen(3000, async () => {
  console.log(`Server started on 3000...`);
});