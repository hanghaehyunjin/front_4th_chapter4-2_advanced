import { Button, ButtonGroup, Flex, Heading, Stack } from "@chakra-ui/react";
import ScheduleTable from "./ScheduleTable.tsx";
import { useScheduleContext, TableProvider } from "./ScheduleContext.tsx";
import SearchDialog from "./SearchDialog.tsx";
import { useState, useCallback, memo } from "react";

const ScheduleTableContainer = memo(
  ({
    tableId,
    index,
    onDuplicate,
    onRemove,
    onTimeClick,
    disabledRemoveButton,
  }: {
    tableId: string;
    index: number;
    onDuplicate: () => void;
    onRemove: () => void;
    onTimeClick: (info: { day?: string; time?: number }) => void;
    disabledRemoveButton: boolean;
  }) => {
    const handleTimeClick = useCallback(
      (timeInfo: { day: string; time: number }) => {
        onTimeClick(timeInfo);
      },
      [onTimeClick]
    );

    return (
      <TableProvider tableId={tableId}>
        <Stack width="600px">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading as="h3" fontSize="lg">
              시간표 {index + 1}
            </Heading>
            <ButtonGroup size="sm" isAttached>
              <Button colorScheme="green" onClick={() => onTimeClick({})}>
                시간표 추가
              </Button>
              <Button colorScheme="green" mx="1px" onClick={onDuplicate}>
                복제
              </Button>
              <Button
                colorScheme="green"
                isDisabled={disabledRemoveButton}
                onClick={onRemove}
              >
                삭제
              </Button>
            </ButtonGroup>
          </Flex>
          <ScheduleTable onScheduleTimeClick={handleTimeClick} />
        </Stack>
      </TableProvider>
    );
  }
);

export const ScheduleTables = memo(() => {
  const { tableIds, duplicateSchedule, removeSchedule } = useScheduleContext();
  const [searchInfo, setSearchInfo] = useState<{
    tableId: string;
    day?: string;
    time?: number;
  } | null>(null);

  const disabledRemoveButton = tableIds.length === 1;

  const handleTimeClick = useCallback(
    (tableId: string, info: { day?: string; time?: number }) => {
      setSearchInfo({ tableId, ...info });
    },
    []
  );

  const handleCloseSearch = useCallback(() => {
    setSearchInfo(null);
  }, []);

  return (
    <>
      <Flex w="full" gap={6} p={6} flexWrap="wrap">
        {tableIds.map((tableId, index) => (
          <ScheduleTableContainer
            key={`schedule-table-${index}`}
            tableId={tableId}
            index={index}
            onDuplicate={() => duplicateSchedule(tableId)}
            onRemove={() => removeSchedule(tableId)}
            onTimeClick={(info) => handleTimeClick(tableId, info)}
            disabledRemoveButton={disabledRemoveButton}
          />
        ))}
      </Flex>
      <SearchDialog searchInfo={searchInfo} onClose={handleCloseSearch} />
    </>
  );
});
