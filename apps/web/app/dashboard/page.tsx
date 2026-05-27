import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card"

const DashboardPage = () => {
    return <div className="h-full w-full flex justify-center pl-20 py-10 flex-col">
        <div className="flex-col space-y-5 mb-10">
            <p>Recent Videos</p>
            <div className="flex justify-between pr-40">
                <Card className="w-80">
                    <CardContent>
                        First Video
                    </CardContent>
                    <CardDescription className="px-4">
                        this is first video
                    </CardDescription>
                    <CardFooter>
                        this is footer
                    </CardFooter>
                </Card>
                                <Card className="w-80">
                    <CardContent>
                        First Video
                    </CardContent>
                    <CardDescription className="px-4">
                        this is first video
                    </CardDescription>
                    <CardFooter>
                        this is footer
                    </CardFooter>
                </Card>
                                <Card className="w-80">
                    <CardContent>
                        First Video
                    </CardContent>
                    <CardDescription className="px-4">
                        this is first video
                    </CardDescription>
                    <CardFooter>
                        this is footer
                    </CardFooter>
                </Card>
            </div>
        </div>

        <div className="flex-col space-y-5 mt-10">
            <p>Recent Folders</p>
                        <div className="flex justify-between pr-40">
                <Card className="w-80">
                    <CardContent>
                        First Video
                    </CardContent>
                    <CardDescription className="px-4">
                        this is first video
                    </CardDescription>
                </Card>
                                <Card className="w-80">
                    <CardContent>
                        First Video
                    </CardContent>
                    <CardDescription className="px-4">
                        this is first video
                    </CardDescription>
                </Card>
                                <Card className="w-80">
                    <CardContent>
                        First Video
                    </CardContent>
                    <CardDescription className="px-4">
                        this is first video
                    </CardDescription>
                </Card>
            </div>
        </div>
    </div>
}

export default DashboardPage