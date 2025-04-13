export type ResultType = {
  mbti: string;
  trait: {
    type: string;
    description: string;
  };
  recommendation: string;
  tags: string[];
  recommended_regions: string[];
  user_answer_id: number;
};
