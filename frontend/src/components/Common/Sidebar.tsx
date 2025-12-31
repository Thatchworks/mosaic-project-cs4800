import { Box, Flex, IconButton, Text, Heading } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { FaBars } from "react-icons/fa"

import type { UserPublic } from "@/client"
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerRoot,
  DrawerTrigger,
} from "../ui/drawer"
import SidebarItems from "./SidebarItems"

const Sidebar = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile */}
      <Box display={{ base: "block", lg: "none" }}>
        <DrawerRoot
          placement="start"
          open={open}
          onOpenChange={(e) => setOpen(e.open)}
          size={"full"}
        >
          <DrawerBackdrop />
          <DrawerTrigger asChild>
            <IconButton
              variant="ghost"
              color="inherit"
              aria-label="Open Menu"
              m={4}
            >
              <FaBars />
            </IconButton>
          </DrawerTrigger>
          <DrawerContent maxW="xs" bg="white">
            <DrawerCloseTrigger />
            <DrawerBody>
              <Flex flexDir="column" justify="space-between" h="full">
                <Box>
                  <Heading size="2xl" mb={4} px={4} pt={4}>
                    mosaic
                  </Heading>
                  <SidebarItems onClose={() => setOpen(false)} />
                </Box>
                {currentUser?.email && (
                  <Text fontSize="sm" p={2} truncate maxW="sm" color="#64748B">
                    Logged in as: {currentUser.email}
                  </Text>
                )}
              </Flex>
            </DrawerBody>
          </DrawerContent>
        </DrawerRoot>
      </Box>

      {/* Desktop */}
      <Box
        display={{ base: "none", lg: "flex" }}
        bg="white"
        borderRight="1px solid #E2E8F0"
        maxW="xs"
        h="full"
        p={4}
      >
        <Box w="100%">
          <SidebarItems />
        </Box>
      </Box>
    </>
  )
}

export default Sidebar