import z from "zod";

export const ContestCreationSchema = z.object({
    title: z.string(),
    description: z.string(),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime()
})

export const ContestMcqSchema = z.object({
    questionText: z.string(),
    options: z.string().array(),
    correctOptionIndex: z.number().positive(),
    points: z.number().positive()
})

export const ContestMcqSubSchema = z.object({
    selectedOptionIndex: z.number().positive()
})

export const ContestDsaSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    tags: z.array(z.string()).min(1),
    points: z.number().positive(),
    timeLimit: z.number().positive(),
    memoryLimit: z.number().positive(),
    testCases: z.array(z.object({
        input: z.string().min(1),
        expectedOutput: z.string().min(1),
        isHidden: z.boolean()
    })).min(1),
})

export const ContestDsaSubSchema = z.object({
    code: z.string().min(1),
    language: z.string().min(1)
})