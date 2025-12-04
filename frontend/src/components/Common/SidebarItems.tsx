import { Box, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import {
  FiBriefcase,
  FiFolder,
  FiHome,
  FiImage,
  FiLogOut,
  FiSettings,
  FiUsers,
} from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import { Button } from "@/components/ui/button"
import type { UserPublic } from "@/client"
import useAuth from "@/hooks/useAuth"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/dashboard" },
  { icon: FiFolder, title: "Projects", path: "/projects", requiresOrg: true },
  { icon: FiImage, title: "Galleries", path: "/galleries", requiresOrg: true },
  {
    icon: FiBriefcase,
    title: "Organization",
    path: "/organization",
    requiresOrg: true,
    teamOnly: true,
  },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
  requiresOrg?: boolean
  teamOnly?: boolean
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()

  // Check if user has organization (clients always have access, team members need org)
  const hasOrganization =
    currentUser?.user_type === "client" || currentUser?.organization_id

  // Filter items based on user status
  let finalItems: Item[] = items.filter((item) => {
    // Hide items that require org if user doesn't have one
    if (item.requiresOrg && !hasOrganization) return false
    // Hide team-only items from clients
    if (item.teamOnly && currentUser?.user_type !== "team_member") return false
    return true
  })

  // Add admin page for superusers
  if (currentUser?.is_superuser) {
    finalItems = [
      ...finalItems,
      { icon: FiUsers, title: "Admin", path: "/admin" },
    ]
  }

  const listItems = finalItems.map(({ icon, title, path }) => (
    <RouterLink key={title} to={path} onClick={onClose}>
      <Button
        variant="ghost"
        w="100%"
        justifyContent="flex-start"
        gap={4}
        px={4}
        py={2}
        color="#64748B"
        _hover={{
          background: "#F1F5F9",
          color: "#1E3A8A",
        }}
        _active={{
          background: "#DBEAFE",
          color: "#1E3A8A",
        }}
        fontSize="sm"
      >
        <Icon as={icon} />
        <Text fontWeight="500">{title}</Text>
      </Button>
    </RouterLink>
  ))

  return (
    <>
      <Text fontSize="s" px={4} py={2} fontWeight="bold" color="#1E3A8A" letterSpacing="wide">
        MENU
      </Text>
      <Box>
        {listItems}
        <Button
          variant="ghost"
          w="100%"
          justifyContent="flex-start"
          onClick={() => {
            logout()
            onClose?.()
          }}
          gap={4}
          px={4}
          py={2}
          color="#64748B"
          _hover={{
            background: "#F1F5F9",
            color: "#1E3A8A",
          }}
          fontSize="sm"
        >
          <Icon as={FiLogOut} />
          <Text fontWeight="500">Log Out</Text>
        </Button>
      </Box>
    </>
  )
}

export default SidebarItems