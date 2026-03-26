-- CreateTable
CREATE TABLE "MeetingRecording" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meetingId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "teamId" TEXT,

    CONSTRAINT "MeetingRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingRecording_meetingId_createdAt_idx" ON "MeetingRecording"("meetingId", "createdAt");

-- AddForeignKey
ALTER TABLE "MeetingRecording" ADD CONSTRAINT "MeetingRecording_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "TeamMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRecording" ADD CONSTRAINT "MeetingRecording_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRecording" ADD CONSTRAINT "MeetingRecording_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
