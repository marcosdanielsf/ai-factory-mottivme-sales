import { useParams } from "react-router-dom";

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary">Board: {boardId}</h1>
      <p className="text-text-muted mt-2">Table view coming in Phase 2</p>
    </div>
  );
};

export default BoardPage;
