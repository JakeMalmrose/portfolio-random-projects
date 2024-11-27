import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({

  UserPoints: a
    .model({
      userId: a.string().required(),
      points: a.integer().required(),
    })
    .authorization(allow => [
      allow.owner(),
      allow.authenticated()
    ]),

  Poll: a
    .model({
      title: a.string().required(),
      optionA: a.string().required(),
      optionB: a.string().required(),
      creatorId: a.string().required(),
      status: a.enum(['ACTIVE', 'RESOLVED_A', 'RESOLVED_B']),
      totalPointsA: a.integer().required(),
      totalPointsB: a.integer().required(),
    })
    .authorization(allow => [
      allow.authenticated().to(['read']),
      allow.guest().to(['read']),
      allow.owner().to(['create', 'update', 'delete']),
    ]),

  Bet: a
    .model({
      userId: a.string().required(),
      pollId: a.string().required(),
      amount: a.integer().required(),
      choice: a.enum(['A', 'B']),
    })
    .authorization(allow => [
      allow.owner().to(['create', 'read']),
      allow.authenticated().to(['read']),
      allow.guest().to(['read']),
    ]),
})

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
