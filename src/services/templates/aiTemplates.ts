export const initTemplate = (news: string, topics: string, irrelevantTopics: string, newsItemLimit: number) => `
Analyze the news items and identify the most relevant ones based on the given security topics.

News: ${news}

Relevant Topics: ${topics}

Exclude news items related to: ${irrelevantTopics}

Select the top ${newsItemLimit} relevant items.

Return only their IDs.
`;

export const reducedTemplate = (news: string, topics: string, irrelevantTopics: string, newsItemLimit: number) => `
Imagine you are a PR expert. You are given a list of news items and a list of security topics. Your task is to identify the most interesting and relevant news items based on the given topics.

Relevant Topics: ${topics}

News: ${news}

Give exactly ${newsItemLimit} news items.

Return only their IDs.
`;