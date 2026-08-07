import { NextRequest } from "next/server";
import { prisma } from "@/app/_lib/prisma/prisma";
import { supabase } from "@/app/_lib/supabase/client";

export const getCurrentAppUser = async (request: NextRequest) => {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  const appUser = await prisma.user.findUnique({
    where: {
      supabaseUserId: user.id,
    },
  });

  return appUser;
}