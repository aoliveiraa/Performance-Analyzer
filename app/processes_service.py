import json


def extract_processes_from_json(content: str):
    data = json.loads(content)

    result = []

    instances = data.get("instances", [])

    for instance in instances:

        instance_name = instance.get(
            "instanceName",
            ""
        )

        processes = (
            instance.get("instanceData", {})
            .get("systemStatus", {})
            .get("processes", [])
        )

        for process in processes:

            process_id = process.get(
                "id",
                ""
            )

            process_name = process.get(
                "name",
                ""
            )

            running_items = process.get(
                "running",
                []
            )

            if not running_items:

                running_text = ""

            else:

                running_text = " | ".join(
                    sorted(
                        {
                            str(item).strip()
                            for item in running_items
                            if str(item).strip()
                        }
                    )
                )

            result.append(
                {
                    "instance": instance_name,
                    "process_id": process_id,
                    "process_name": process_name,
                    "process_running": running_text,
                }
            )

    return result