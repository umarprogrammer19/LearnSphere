"use client"

import { BookingModal } from "@/components/booking-modal"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { initializeFirebase } from "@/firebase"
import { useDoc } from "@/firebase/firestore/use-doc"
import { useMemoFirebase } from "@/firebase/provider"
import { doc } from "firebase/firestore"
import { BookOpen, CheckCircle, Clock, GraduationCap, Loader2, MapPin, Star, Award, Users } from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"

const { firestore } = initializeFirebase()

export default function TutorDetailPage() {
  const params = useParams()
  const { id } = params
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const tutorDocRef = useMemoFirebase(
    () => (typeof id === "string" ? doc(firestore, "users", id) : null),
    [id, firestore],
  )

  const { data: tutor, isLoading, error } = useDoc<any>(tutorDocRef)

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`
    if (firstName) return firstName.charAt(0)
    return "T"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <>
        <Header />
        <main className="flex-grow px-20 py-16 bg-background">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <MapPin className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tutor Not Found</h2>
            <p className="text-gray-600 mb-8">
              {error ? error.message : "The tutor you are looking for does not exist or is not verified."}
            </p>
            <Button
              asChild
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <a href="/find-tutor">Back to Search</a>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="bg-background">
        <Header />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200">
          <div className="px-20 py-12 lg:py-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <Avatar className="w-40 h-40 border-4 border-white shadow-xl">
                  <AvatarImage src={tutor.profileImageUrl || "/placeholder.svg"} />
                  <AvatarFallback className="text-6xl bg-gradient-to-br from-blue-400 to-indigo-400 text-white">
                    {getInitials(tutor.firstName, tutor.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="mb-4">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 mb-4">
                      <CheckCircle className="w-4 h-4 mr-1" /> Verified Tutor
                    </Badge>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                    {tutor.firstName} {tutor.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">
                        {tutor.city}, {tutor.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="font-semibold text-gray-900">4.0 (15 reviews)</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      PKR {tutor.hourlyPricing}
                    </span>
                    <span className="text-gray-600">/hour</span>
                  </div>
                  <Button
                    size="lg"
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    Book a Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="px-20 py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <Card className="rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      About Me
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                      {tutor.about || "No information provided."}
                    </p>
                  </CardContent>
                </Card>

                {/* Reviews Section */}
                <Card className="rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-600" />
                      </div>
                      Student Reviews
                    </h2>
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-600 font-medium">No reviews yet</p>
                      <p className="text-gray-500 text-sm mt-1">Be the first to review this tutor after your session</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Quick Info Card */}
                <Card className="rounded-2xl shadow-md border border-gray-200 overflow-hidden sticky top-8">
                  <CardContent className="p-8 space-y-6">
                    <div className="pb-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        Qualification
                      </h3>
                      <p className="text-gray-700 font-medium capitalize">{tutor.qualification}</p>
                    </div>

                    <div className="pb-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        Subjects
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {tutor.teachingSubjects?.map((subject: string) => (
                          <Badge key={subject} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pb-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                        <Award className="w-5 h-5 text-green-600" />
                        Experience
                      </h3>
                      <p className="text-gray-700 font-medium">5+ Years</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Verification
                      </h3>
                      <p className="text-gray-700 font-medium capitalize">{tutor.tutorVerificationStatus}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Availability Card */}
                <Card className="rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                  <CardContent className="p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Available Slots
                    </h2>
                    {tutor.availableSlots && tutor.availableSlots.length > 0 ? (
                      <div className="space-y-4">
                        {tutor.availableSlots
                          .filter((day: any) => day.slots.length > 0)
                          .map((day: any) => (
                            <div key={day.day} className="pb-4 border-b border-gray-200 last:border-0">
                              <h4 className="font-semibold text-gray-900 mb-3">{day.day}</h4>
                              <div className="flex flex-wrap gap-2">
                                {day.slots.map((slot: any, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="border-blue-300 text-blue-700 bg-blue-50"
                                  >
                                    {slot.startTime} - {slot.endTime}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-600 font-medium">Availability not set</p>
                        <p className="text-gray-500 text-sm mt-1">Contact the tutor to arrange a session</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
      {/* Check if tutor then show booking modal */}
      {tutor && <BookingModal tutor={tutor} isOpen={isBookingModalOpen} setIsOpen={setIsBookingModalOpen} />}
    </>
  )
}
