import {
  Avatar,
  Button,
  Card,
  Flex,
  Heading,
  Icon,
  Span,
  Stack,
  Text,
  Textarea,
  Timeline,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import {
  FiAlertCircle,
  FiImage,
  FiMessageSquare,
  FiTrash2,
  FiUser,
} from "react-icons/fi"
import { Field } from "@/components/ui/field"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

interface CommentsListProps {
  projectId: string
}

interface CommentFormData {
  content: string
}

type ActivityKind = "page" | "photo" | "changes_requested"

const photoCommentRegex = /^\[Photo:\s*([^\]]+)\]\s*(.*)$/s
const changesRequestedRegex =
  /^\[Gallery:\s*([^\]]+)\]\s*Changes requested:\s*(.*)$/s

function parseCommentToActivity(content: string): {
  kind: ActivityKind
  targetLabel?: string
  body: string
} {
  const photoMatch = content.match(photoCommentRegex)
  if (photoMatch) {
    const [, photoName, body] = photoMatch
    return {
      kind: "photo",
      targetLabel: photoName.trim(),
      body: (body || "").trim(),
    }
  }

  const changesMatch = content.match(changesRequestedRegex)
  if (changesMatch) {
    const [, galleryLabel, body] = changesMatch
    return {
      kind: "changes_requested",
      targetLabel: galleryLabel.trim(),
      body: (body || "").trim(),
    }
  }

  return { kind: "page", body: content.trim() }
}

export function CommentsList({ projectId }: CommentsListProps) {
  const { user: currentUser } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>()

  const createMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      const baseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "")
      const response = await fetch(`${baseUrl}/api/v1/comments/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.content,
          project_id: projectId,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to add comment")
      }
      return response.json()
    },
    onSuccess: () => {
      showSuccessToast("Comment added successfully")
      queryClient.invalidateQueries({
        queryKey: ["projectComments", projectId],
      })
      reset()
    },
    onError: (error: any) => {
      showErrorToast(error.message || "Failed to add comment")
    },
  })

  const onSubmit = (data: CommentFormData) => {
    createMutation.mutate(data)
  }

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["projectComments", projectId],
    queryFn: async () => {
      const baseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "")
      const response = await fetch(`${baseUrl}/api/v1/comments/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) return { data: [], count: 0 }
      return response.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const baseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "")
      const response = await fetch(`${baseUrl}/api/v1/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to delete comment")
      return response.json()
    },
    onSuccess: () => {
      showSuccessToast("Comment deleted")
      queryClient.invalidateQueries({
        queryKey: ["projectComments", projectId],
      })
    },
    onError: () => {
      showErrorToast("Failed to delete comment")
    },
  })

  const comments = commentsData?.data || []

  if (isLoading) {
    return (
      <Card.Root bg="white" borderColor="#E2E8F0" borderWidth="1px">
        <Card.Header>
          <Heading size="lg" color="#1E3A8A" fontFamily="'Poppins', sans-serif">Comments</Heading>
        </Card.Header>
        <Card.Body>
          <Text color="#64748B">Loading comments...</Text>
        </Card.Body>
      </Card.Root>
    )
  }

  return (
    <Card.Root bg="white" borderColor="#E2E8F0" borderWidth="1px">
      <Card.Header>
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="#1E3A8A" fontFamily="'Poppins', sans-serif">Comments</Heading>
          <Flex align="center" gap={2}>
            <FiMessageSquare color="#1E40AF" />
            <Text fontSize="sm" color="#64748B">
              {comments.length} comments
            </Text>
          </Flex>
        </Flex>
      </Card.Header>
      <Card.Body>
        <Timeline.Root size="lg" variant="subtle">
          {comments.length === 0 ? (
            <Timeline.Item>
              <Timeline.Connector>
                <Timeline.Separator />
                <Timeline.Indicator>
                  <Icon fontSize="xs">
                    <FiMessageSquare />
                  </Icon>
                </Timeline.Indicator>
              </Timeline.Connector>
              <Timeline.Content>
                <Timeline.Title>
                  <Span color="#64748B">No comments yet. Be the first to comment!</Span>
                </Timeline.Title>
              </Timeline.Content>
            </Timeline.Item>
          ) : (
            comments.map((comment: any) => {
              const author =
                comment.user?.full_name || comment.user?.email || "Unknown User"

              const activity = parseCommentToActivity(comment.content || "")

              const indicatorIcon =
                activity.kind === "photo" ? (
                  <FiImage />
                ) : activity.kind === "changes_requested" ? (
                  <FiAlertCircle />
                ) : (
                  <FiMessageSquare />
                )

              const actionText =
                activity.kind === "photo"
                  ? "commented on"
                  : activity.kind === "changes_requested"
                    ? "requested changes"
                    : "commented"

              const createdAt = new Date(`${comment.created_at}Z`).toLocaleString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )

              return (
                <Timeline.Item key={comment.id}>
                  <Timeline.Connector>
                    <Timeline.Separator />
                    <Timeline.Indicator>
                      <Icon fontSize="xs">
                        {indicatorIcon}
                      </Icon>
                    </Timeline.Indicator>
                  </Timeline.Connector>
                  <Timeline.Content gap="3">
                    <Timeline.Title>
                      <Flex align="center" gap={2} wrap="wrap">
                        <Avatar.Root size="2xs">
                          <Avatar.Fallback name={author}>
                            <FiUser />
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <Span fontWeight="medium" color="#12151dff">
                          {author}
                        </Span>
                        <Span color="#64748B">{actionText}</Span>
                        {activity.kind === "photo" && activity.targetLabel ? (
                          <Span fontWeight="medium">Photo: {activity.targetLabel}</Span>
                        ) : null}
                        {activity.kind === "changes_requested" && activity.targetLabel ? (
                          <Span fontWeight="medium">{activity.targetLabel}</Span>
                        ) : null}
                        <Span color="#64748B">on {createdAt}</Span>

                        {currentUser?.id === comment.user_id && (
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => deleteMutation.mutate(comment.id)}
                            loading={deleteMutation.isPending}
                            ml="auto"
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        )}
                      </Flex>
                    </Timeline.Title>
                    <Card.Root size="sm" bg="white" borderColor="#E2E8F0" borderWidth="1px">
                      <Card.Body>
                        <Text fontSize="sm" color="#1E293B">
                          {activity.body}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  </Timeline.Content>
                </Timeline.Item>
              )
            })
          )}

          {/* Add comment */}
          <Timeline.Item>
            <Timeline.Connector>
              <Timeline.Separator />
              <Timeline.Indicator>
                <Avatar.Root size="2xs">
                  <Avatar.Fallback name={currentUser?.full_name || currentUser?.email || "You"}>
                    <FiUser />
                  </Avatar.Fallback>
                </Avatar.Root>
              </Timeline.Indicator>
            </Timeline.Connector>
            <Timeline.Content gap="3" mt="-1" w="full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack gap={3}>
                  <Field invalid={!!errors.content} errorText={errors.content?.message}>
                    <Textarea
                      {...register("content", { required: "Comment is required" })}
                      placeholder="Add comment..."
                      rows={3}
                      resize="none"
                      size="sm"
                    />
                  </Field>
                  <Flex justify="flex-end">
                    <Button
                      type="submit"
                      size="sm"
                      loading={createMutation.isPending}
                    >
                      Post Comment
                    </Button>
                  </Flex>
                </Stack>
              </form>
            </Timeline.Content>
          </Timeline.Item>
        </Timeline.Root>
      </Card.Body>
    </Card.Root>
  )
}