import Button from "../../components/UI/Button";
import Card from "../../components/UI/Card";
import Badge from "../../components/UI/Badge";
import Avatar from "../../components/UI/Avatar";
import Pagination from "../../components/UI/Pagination";
import ProgressBar from "../../components/UI/ProgressBar";
import SearchBar from "../../components/UI/SearchBar";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import EmptyState from "../../components/UI/EmptyState";

export default function UIShowcase() {
  return (
    <div className="min-h-screen bg-slate-100 p-10">

      <h1 className="text-4xl font-bold mb-10">
        MACEVO UI Library
      </h1>

      <div className="space-y-12">

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            Button
          </h2>

          <Button>
            Bouton
          </Button>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            Badge
          </h2>

          <Badge>
            Nouveau
          </Badge>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            Avatar
          </h2>

          <Avatar />
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            ProgressBar
          </h2>

          <ProgressBar value={60} />
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            SearchBar
          </h2>

          <SearchBar />
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            Pagination
          </h2>

          <Pagination />
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            Loading Spinner
          </h2>

          <LoadingSpinner />
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            Empty State
          </h2>

          <EmptyState />
        </Card>

      </div>

    </div>
  );
}