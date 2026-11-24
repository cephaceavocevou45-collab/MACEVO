import Card from "./Card";
import SkeletonLoader from "./SkeletonLoader";

export default function SkeletonReportCard() {

  return (

    <Card className="p-6">

      <div className="flex justify-between">

        <div className="flex-1">

          <SkeletonLoader className="h-7 w-56 mb-4" />

          <SkeletonLoader className="h-4 w-full mb-2" />

          <SkeletonLoader className="h-4 w-3/4 mb-6" />

          <div className="flex gap-3">

            <SkeletonLoader className="h-8 w-20 rounded-full" />

            <SkeletonLoader className="h-8 w-20 rounded-full" />

            <SkeletonLoader className="h-8 w-20 rounded-full" />

          </div>

        </div>

        <SkeletonLoader className="w-12 h-12 rounded-xl" />

      </div>

    </Card>

  );

}