"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useCollection } from "@/firebase/firestore/use-collection"
import { collection, query, where } from "firebase/firestore"
import { initializeFirebase } from "@/firebase"
import { Loader2, Search, MapPin, Star, Filter, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useMemo } from "react"
import { useMemoFirebase } from "@/firebase/provider"
import { GoogleMap } from "@/components/google-map"

const { firestore } = initializeFirebase()

export default function FindTutorPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showMap, setShowMap] = useState(false)

  const tutorsQuery = useMemoFirebase(
    () =>
      query(
        collection(firestore, "users"),
        where("role", "==", "teacher"),
        where("tutorVerificationStatus", "==", "verified"),
      ),
    [],
  )

  const { data: tutors, isLoading, error } = useCollection<any>(tutorsQuery)

  const filteredTutors = useMemo(() => {
    if (!tutors) return []
    return tutors.filter((tutor) => {
      const lowerSearchTerm = searchTerm.toLowerCase()
      const nameMatch = `${tutor.firstName} ${tutor.lastName}`.toLowerCase().includes(lowerSearchTerm)
      const cityMatch = tutor.city?.toLowerCase().includes(lowerSearchTerm)
      const subjectMatch = tutor.teachingSubjects?.some((subject: string) =>
        subject.toLowerCase().includes(lowerSearchTerm),
      )
      return nameMatch || cityMatch || subjectMatch
    })
  }, [tutors, searchTerm])

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`
    if (firstName) return firstName.charAt(0)
    return "T"
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 lg:py-24 border-b border-gray-200">
          <div className="px-20 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
                <span className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> {filteredTutors.length || 0} Verified Tutors Available
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 text-balance">
                Find Your Ideal{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Tutor
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Search through verified tutors in your area. Filter by subject, location, and hourly rate to find the
                perfect match for your learning goals.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by subject, city, or tutor name..."
                  className="pl-12 h-14 rounded-xl border-2 border-gray-200 focus:border-blue-500 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  onClick={() => setShowMap(!showMap)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {showMap ? "Hide Map" : "View on Map"}
                </Button>
                <Button variant="outline" className="rounded-xl border-2 bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        {showMap && (
          <section className="px-20 py-8 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <Card className="rounded-2xl shadow-lg border-0">
                <CardContent className="p-2">
                  <GoogleMap tutors={filteredTutors} height="500px" showSearchBox={true} />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Tutors Grid */}
        <section className="px-20 py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            {isLoading && (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
            )}

            {error && (
              <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-600 font-semibold">Error loading tutors</p>
                <p className="text-red-500 text-sm mt-1">{error.message}</p>
              </div>
            )}

            {!isLoading && !error && filteredTutors.length > 0 && (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {filteredTutors.length} {filteredTutors.length === 1 ? "Tutor" : "Tutors"} Found
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTutors.map((tutor) => (
                    <Card
                      key={tutor.id}
                      className="flex flex-col rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                    >
                      <CardHeader className="pb-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                            <AvatarImage src={tutor.profileImageUrl || "/placeholder.svg"} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-indigo-400 text-white">
                              {getInitials(tutor.firstName, tutor.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-xl text-gray-900">
                              {tutor.firstName} {tutor.lastName}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span>{tutor.city}</span>
                            </div>
                            <div className="flex items-center mt-2 gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                              <span className="text-xs text-gray-600 ml-1">(4.0)</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow pt-6">
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Subjects</h4>
                          <div className="flex flex-wrap gap-2">
                            {tutor.teachingSubjects?.slice(0, 3).map((subject: string) => (
                              <Badge
                                key={subject}
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                {subject}
                              </Badge>
                            ))}
                            {tutor.teachingSubjects?.length > 3 && (
                              <Badge variant="outline" className="border-gray-300">
                                +{tutor.teachingSubjects.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Hourly Rate</h4>
                          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            PKR {tutor.hourlyPricing}/hr
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 border-t border-gray-200">
                        <Button
                          asChild
                          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          <Link href={`/tutor/${tutor.id}`}>View Profile</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {!isLoading && filteredTutors.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">No tutors found</p>
                <p className="text-gray-600">Try adjusting your search or check back later for more tutors.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
