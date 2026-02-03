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